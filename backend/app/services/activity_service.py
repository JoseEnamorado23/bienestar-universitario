import uuid
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.activity_attendance import ActivityAttendance
from app.models.student import Student
from app.models.settings import SystemSetting
from app.schemas.activity import ActivityCreate, ActivityUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _new_token() -> str:
    return str(uuid.uuid4())


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia en metros entre dos coordenadas GPS."""
    R = 6_371_000  # Radio terrestre en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _get_setting(db: Session, key: str) -> Optional[str]:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return row.value if row else None


class ActivityService:

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    @staticmethod
    def create_activity(db: Session, admin_id: int, data: ActivityCreate) -> Activity:
        now = datetime.now(timezone.utc)

        # QR inicial
        token = _new_token()
        expires_at = None

        if data.qr_type == "STATIC":
            expires_at = data.qr_static_expiry
        elif data.qr_type == "DYNAMIC":
            expires_at = now + timedelta(seconds=15)

        activity = Activity(
            title=data.title,
            description=data.description,
            location=data.location,
            event_datetime=data.event_datetime,
            hours_reward=data.hours_reward,
            qr_type=data.qr_type,
            qr_token=token,
            qr_token_expires_at=expires_at,
            require_location=data.require_location,
            image_url=data.image_url,
            status=data.status,
            is_active=True,
            created_by_id=admin_id,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity

    @staticmethod
    def get_activities(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
    ) -> List[Activity]:
        q = db.query(Activity)
        if status_filter:
            q = q.filter(Activity.status == status_filter)
        return q.order_by(Activity.event_datetime.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_activity(db: Session, activity_id: int) -> Activity:
        act = db.query(Activity).filter(Activity.id == activity_id).first()
        if not act:
            raise HTTPException(status_code=404, detail="Actividad no encontrada.")
        return act

    @staticmethod
    def update_activity(db: Session, activity_id: int, data: ActivityUpdate) -> Activity:
        act = ActivityService.get_activity(db, activity_id)
        update_data = data.model_dump(exclude_unset=True)

        # Si cambia el tipo de QR, regenerar token y recalcular expiración
        now = datetime.now(timezone.utc)
        if "qr_type" in update_data:
            act.qr_token = _new_token()
            new_type = update_data["qr_type"]
            if new_type == "STATIC":
                act.qr_token_expires_at = update_data.pop("qr_static_expiry", None)
            elif new_type == "DYNAMIC":
                act.qr_token_expires_at = now + timedelta(seconds=15)
            else:
                act.qr_token_expires_at = None

        # Si solo se actualiza la expiración estática
        if "qr_static_expiry" in update_data and update_data.get("qr_type", act.qr_type) == "STATIC":
            act.qr_token_expires_at = update_data.pop("qr_static_expiry")
        elif "qr_static_expiry" in update_data:
            update_data.pop("qr_static_expiry")

        for field, value in update_data.items():
            setattr(act, field, value)

        db.commit()
        db.refresh(act)
        return act

    @staticmethod
    def delete_activity(db: Session, activity_id: int) -> Activity:
        act = ActivityService.get_activity(db, activity_id)
        act.status = "FINISHED"
        act.is_active = False
        db.commit()
        db.refresh(act)
        return act

    # ------------------------------------------------------------------
    # QR rotation (para QR dinámico)
    # ------------------------------------------------------------------

    @staticmethod
    def rotate_qr_token(db: Session, activity_id: int) -> Activity:
        act = ActivityService.get_activity(db, activity_id)
        now = datetime.now(timezone.utc)
        act.qr_token = _new_token()
        act.qr_token_expires_at = now + timedelta(seconds=15)
        db.commit()
        db.refresh(act)
        return act

    @staticmethod
    def get_public_qr_data(db: Session, activity_id: int) -> dict:
        """
        Obtiene datos públicos del QR para proyección.
        Si es dinámico y ha expirado, lo rota automáticamente.
        """
        act = ActivityService.get_activity(db, activity_id)
        
        if act.status != "PUBLISHED" or not act.is_active:
            raise HTTPException(status_code=403, detail="Actividad no disponible para proyección.")
            
        if act.qr_type == "DYNAMIC":
            now = datetime.now(timezone.utc)
            exp = act.qr_token_expires_at
            
            if exp and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
                
            if not exp or now >= (exp - timedelta(seconds=3)):
                act = ActivityService.rotate_qr_token(db, activity_id)
                
        return {
            "title": act.title,
            "qr_type": act.qr_type,
            "qr_token": act.qr_token,
            "qr_token_expires_at": act.qr_token_expires_at
        }

    # ------------------------------------------------------------------
    # Registro de asistencia
    # ------------------------------------------------------------------

    @staticmethod
    def register_attendance(
        db: Session,
        token: str,
        student_id: int,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> ActivityAttendance:
        now = datetime.now(timezone.utc)

        # 1. Buscar actividad por token
        act = db.query(Activity).filter(Activity.qr_token == token).first()
        if not act:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Código QR inválido o no reconocido.",
            )

        # 2. Verificar que está activa
        if not act.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta actividad no está aceptando asistencias actualmente.",
            )

        # 3. Verificar expiración según tipo
        if act.qr_type in ("STATIC", "DYNAMIC"):
            if act.qr_token_expires_at is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El código QR no tiene fecha de expiración configurada.",
                )
            # Normalizar timezone
            exp = act.qr_token_expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if now > exp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El código QR ha expirado." if act.qr_type == "STATIC"
                           else "El código QR dinámico ha expirado. Escanea el código actual en pantalla.",
                )

        # 4. Validación de ubicación
        if act.require_location:
            if latitude is None or longitude is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Esta actividad requiere validación de ubicación. Por favor permite el acceso a tu GPS.",
                )

            lat_cfg = _get_setting(db, "UNIVERSITY_LATITUDE")
            lon_cfg = _get_setting(db, "UNIVERSITY_LONGITUDE")
            radius_cfg = _get_setting(db, "UNIVERSITY_RADIUS_METERS")

            if not lat_cfg or not lon_cfg or not radius_cfg:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="La ubicación de la universidad no está configurada en el sistema.",
                )

            distance = _haversine(latitude, longitude, float(lat_cfg), float(lon_cfg))
            if distance > float(radius_cfg):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Estás fuera del área permitida. Distancia: {distance:.0f} m (máximo permitido: {radius_cfg} m).",
                )

        # 5. Verificar que el estudiante no haya asistido antes
        existing = db.query(ActivityAttendance).filter(
            ActivityAttendance.activity_id == act.id,
            ActivityAttendance.student_id == student_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya has registrado tu asistencia a esta actividad.",
            )

        # 6. Crear registro de asistencia
        try:
            attendance = ActivityAttendance(
                activity_id=act.id,
                student_id=student_id,
                hours_earned=act.hours_reward,
                scan_latitude=latitude,
                scan_longitude=longitude,
            )
            db.add(attendance)

            # 7. Sumar horas al estudiante
            student = db.query(Student).filter(Student.id == student_id).first()
            if student:
                student.social_hours_completed += act.hours_reward

            db.commit()
            db.refresh(attendance)
            return attendance

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya has registrado tu asistencia a esta actividad.",
            )

    # ------------------------------------------------------------------
    # Asistencias de una actividad (admin)
    # ------------------------------------------------------------------

    @staticmethod
    def get_attendances(db: Session, activity_id: int) -> List[ActivityAttendance]:
        ActivityService.get_activity(db, activity_id)  # Verifica que existe
        return (
            db.query(ActivityAttendance)
            .filter(ActivityAttendance.activity_id == activity_id)
            .order_by(ActivityAttendance.scanned_at.desc())
            .all()
        )
