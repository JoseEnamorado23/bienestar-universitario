from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_permissions, require_any_permissions
from app.models.user import User
from app.models.student import Student
from app.models.activity import Activity
from app.models.activity_attendance import ActivityAttendance
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityPublicResponse,
    ActivityAdminResponse,
    AttendRequest,
    AttendanceResponse,
    QRRotateResponse,
)
from app.services.activity_service import ActivityService
from app.services.audit_service import AuditService

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _enrich_admin(act: Activity, db: Session) -> dict:
    """Agrega el conteo de asistencias al dict de respuesta admin."""
    data = ActivityAdminResponse.model_validate(act).model_dump()
    data["attendance_count"] = (
        db.query(ActivityAttendance)
        .filter(ActivityAttendance.activity_id == act.id)
        .count()
    )
    return data


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.post("/", response_model=ActivityAdminResponse)
def create_activity(
    *,
    db: Session = Depends(get_db),
    data: ActivityCreate,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Crear una nueva actividad."""
    act = ActivityService.create_activity(db, admin_id=current_user.id, data=data)
    AuditService.log_action(
        db, action="ACTIVITY_CREATED", entity_type="activity", entity_id=act.id,
        user_id=current_user.id,
        details={"title": act.title, "date": str(act.date)}
    )
    return _enrich_admin(act, db)


@router.put("/{activity_id}", response_model=ActivityAdminResponse)
def update_activity(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    data: ActivityUpdate,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Editar una actividad existente."""
    act = ActivityService.update_activity(db, activity_id=activity_id, data=data)
    AuditService.log_action(
        db, action="ACTIVITY_UPDATED", entity_type="activity", entity_id=activity_id,
        user_id=current_user.id,
        details={"title": act.title, "updated_fields": data.dict(exclude_unset=True)}
    )
    return _enrich_admin(act, db)


@router.delete("/{activity_id}", response_model=ActivityAdminResponse)
def delete_activity(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Eliminar (soft-delete) una actividad."""
    act = ActivityService.delete_activity(db, activity_id=activity_id)
    AuditService.log_action(
        db, action="ACTIVITY_DELETED", entity_type="activity", entity_id=activity_id,
        user_id=current_user.id,
        details={"title": act.title}
    )
    return _enrich_admin(act, db)


@router.get("/{activity_id}/admin", response_model=ActivityAdminResponse)
def get_activity_admin(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Detalle de actividad para admins (incluye token QR)."""
    act = ActivityService.get_activity(db, activity_id)
    return _enrich_admin(act, db)


@router.post("/{activity_id}/rotate-qr", response_model=QRRotateResponse)
def rotate_qr(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Generar un nuevo token QR (usar para QR dinámico)."""
    act = ActivityService.rotate_qr_token(db, activity_id)
    return QRRotateResponse(
        qr_token=act.qr_token,
        qr_token_expires_at=act.qr_token_expires_at,
    )


@router.get("/{activity_id}/attendances", response_model=List[AttendanceResponse])
def get_attendances(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    current_user: User = Depends(require_permissions(["activity:manage"])),
) -> Any:
    """Ver lista de asistencias de una actividad."""
    return ActivityService.get_attendances(db, activity_id)


# ---------------------------------------------------------------------------
# Endpoints compartidos (admin + estudiante)
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ActivityPublicResponse])
def list_activities(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permissions(["activity:manage", "loan:read:own"])),
) -> Any:
    """Listar actividades. Disponible para admins y estudiantes."""
    return ActivityService.get_activities(db, skip=skip, limit=limit, status_filter=status)


@router.get("/{activity_id}", response_model=ActivityPublicResponse)
def get_activity_public(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
    current_user: User = Depends(require_any_permissions(["activity:manage", "loan:read:own"])),
) -> Any:
    """Detalle público de una actividad."""
    return ActivityService.get_activity(db, activity_id)


@router.get("/{activity_id}/public-qr-data")
def get_public_qr_data(
    *,
    db: Session = Depends(get_db),
    activity_id: int,
) -> Any:
    """Detalle público del QR para proyección. No requiere auth."""
    return ActivityService.get_public_qr_data(db, activity_id)


# ---------------------------------------------------------------------------
# Registro de asistencia (estudiante)
# ---------------------------------------------------------------------------

@router.post("/attend", response_model=AttendanceResponse)
def attend_activity(
    *,
    db: Session = Depends(get_db),
    body: AttendRequest,
    current_user: User = Depends(require_any_permissions(["loan:read:own", "activity:manage"])),
) -> Any:
    """Registrar asistencia a una actividad mediante QR."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado.")

    attendance = ActivityService.register_attendance(
        db=db,
        token=body.token,
        student_id=student.id,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    # Log audit for attendance
    AuditService.log_action(
        db, action="ACTIVITY_ATTENDANCE", entity_type="activity", 
        entity_id=attendance.activity_id,
        user_id=current_user.id,
        details={
            "activity_name": attendance.activity.title if attendance.activity else "Unknown",
            "hours_earned": float(attendance.hours_earned)
        }
    )
    return attendance


@router.get("/my-activities/history", response_model=List[AttendanceResponse])
def my_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permissions(["loan:read:own", "activity:manage"])),
) -> Any:
    """Historial de actividades del estudiante logueado."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado.")

    return (
        db.query(ActivityAttendance)
        .filter(ActivityAttendance.student_id == student.id)
        .order_by(ActivityAttendance.scanned_at.desc())
        .all()
    )
