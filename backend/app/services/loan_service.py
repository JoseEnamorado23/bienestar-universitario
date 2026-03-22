from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy import or_

from app.models.loan import Loan
from app.models.inventory import Item
from app.models.student import Student
from app.models.settings import SystemSetting
from app.schemas.loan import LoanCreate, LoanAdminCreate

class LoanService:
    @staticmethod
    def _get_setting(db: Session, key: str, default: int) -> int:
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        return int(setting.value) if setting else default

    @staticmethod
    def request_loan(db: Session, student_id: int, item_id: int) -> Loan:
        """Estudiante solicita un préstamo. Pasa a estado SOLICITADO."""
        # Verificar que el estudiante no tenga un préstamo activo, solicitado o vencido
        existing_loan = db.query(Loan).filter(
            Loan.student_id == student_id,
            Loan.status.in_(["SOLICITADO", "ACTIVO", "VENCIDO"])
        ).first()
        
        if existing_loan:
            raise HTTPException(
                status_code=400, 
                detail="Ya tienes un préstamo en curso. Debes devolverlo o esperar a que sea gestionado antes de solicitar otro."
            )

        item = db.query(Item).filter(Item.id == item_id).first()
        if not item or item.status != "ACTIVE":
            raise HTTPException(status_code=404, detail="Implemento no encontrado o inactivo.")
        if item.available_quantity <= 0:
            raise HTTPException(status_code=400, detail="No hay unidades disponibles de este implemento.")

        loan = Loan(
            item_id=item_id,
            student_id=student_id,
            status="SOLICITADO"
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def create_loan_direct(db: Session, admin_id: int, student_doc: str, item_id: int) -> Loan:
        """Admin crea un préstamo directamente y lo activa al instante."""
        student = db.query(Student).filter(Student.national_id == student_doc).all()
        # Find the one with an active user account if multiple (though national_id should be unique-ish per student record)
        # Actually Student model has a user relationship.
        student = db.query(Student).filter(Student.national_id == student_doc).first()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado por cédula.")
            
        # Bloquear si el estudiante está suspendido
        from app.models.user import User
        user = db.query(User).filter(User.id == student.user_id).first()
        if user and user.status and str(user.status) in ("INACTIVE", "UserStatus.INACTIVE"):
             raise HTTPException(
                status_code=403, 
                detail=f"El estudiante {user.first_name} está bloqueado y no puede recibir préstamos. Motivo: {user.block_reason or 'No especificado'}."
            )

        # Verificar si ya tiene un préstamo activo o solicitado
        existing_loan = db.query(Loan).filter(
            Loan.student_id == student.id,
            Loan.status.in_(["SOLICITADO", "ACTIVO", "VENCIDO"])
        ).first()
        
        if existing_loan:
            raise HTTPException(
                status_code=400, 
                detail=f"El estudiante {student.first_name} ya tiene un préstamo en curso ({existing_loan.status})."
            )

        item = db.query(Item).filter(Item.id == item_id).first()
        if not item or item.status != "ACTIVE":
            raise HTTPException(status_code=404, detail="Implemento no encontrado.")
        if item.available_quantity <= 0:
            raise HTTPException(status_code=400, detail="No hay unidades disponibles.")

        # Obtener config
        max_hours = LoanService._get_setting(db, "MAX_LOAN_HOURS", 2)
        
        # Descontar inventario
        item.available_quantity -= 1
        
        now_utc = datetime.now(timezone.utc)
        
        loan = Loan(
            item_id=item_id,
            student_id=student.id,
            issued_by_id=admin_id,
            status="ACTIVO",
            start_time=now_utc,
            expected_return_time=now_utc + timedelta(hours=max_hours)
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def approve_loan(db: Session, loan_id: int, admin_id: int) -> Loan:
        """Admin aprueba una solicitud de préstamo."""
        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Préstamo no encontrado.")
        if loan.status != "SOLICITADO":
            raise HTTPException(status_code=400, detail="El préstamo no está en estado SOLICITADO.")
            
        item = db.query(Item).filter(Item.id == loan.item_id).first()
        if item.available_quantity <= 0:
            raise HTTPException(status_code=400, detail="Ya no hay unidades disponibles para aprobar este préstamo.")

        max_hours = LoanService._get_setting(db, "MAX_LOAN_HOURS", 2)
        item.available_quantity -= 1
        
        now_utc = datetime.now(timezone.utc)
        loan.status = "ACTIVO"
        loan.issued_by_id = admin_id
        loan.start_time = now_utc
        loan.expected_return_time = now_utc + timedelta(hours=max_hours)
        
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def return_loan(db: Session, loan_id: int) -> Loan:
        """Registrar devolución, sumar al inventario y calcular horas sociales."""
        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Préstamo no encontrado.")
        if loan.status not in ["ACTIVO", "VENCIDO"]:
            raise HTTPException(status_code=400, detail="Solo se pueden devolver préstamos activos o vencidos.")

        # Devolver unidad
        item = db.query(Item).filter(Item.id == loan.item_id).first()
        if item:
            item.available_quantity += 1

        now_utc = datetime.now(timezone.utc)
        loan.returned_time = now_utc
        loan.status = "DEVUELTO"

        # Calcular horas
        min_minutes = LoanService._get_setting(db, "MIN_LOAN_MINUTES_TO_COUNT", 15)
        
        # Start time must be utc timezone aware to compare. Our model sets timezone=True
        duration = now_utc - loan.start_time
        total_seconds = duration.total_seconds()
        total_minutes = total_seconds / 60.0

        if total_minutes >= min_minutes:
            # Otorgar la proporción exacta en horas
            hours = total_seconds / 3600.0
            
            # Limitar a máximo_hours en caso de que lo traiga súper tarde? 
            # Si el usuario lo pide, las horas sociales usualmente se tapan al límite.
            max_hours = LoanService._get_setting(db, "MAX_LOAN_HOURS", 2)
            if hours > max_hours:
                hours = max_hours
                
            loan.hours_earned = round(hours, 2)
            
            # Sumar al estudiante
            student = db.query(Student).filter(Student.id == loan.student_id).first()
            if student:
                student.social_hours_completed += loan.hours_earned

        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def reject_loan(db: Session, loan_id: int, admin_id: int, reason: str) -> Loan:
        """Admin rechaza una solicitud de préstamo."""
        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Préstamo no encontrado.")
        if loan.status != "SOLICITADO":
            raise HTTPException(status_code=400, detail="Solo se pueden rechazar préstamos en estado SOLICITADO.")

        loan.status = "RECHAZADO"
        loan.issued_by_id = admin_id
        loan.rejection_reason = reason
        loan.returned_time = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def get_loans(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        program_id: Optional[int] = None,
        time_filter: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc"
    ) -> dict:
        from app.models.user import User
        
        query = db.query(Loan).join(Student).join(User, Student.user_id == User.id).join(Item)
        
        if status_filter and status_filter != "ALL":
            query = query.filter(Loan.status == status_filter)
            
        if program_id:
            query = query.filter(Student.program_id == program_id)
            
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    Student.national_id.ilike(search_pattern),
                    Item.name.ilike(search_pattern)
                )
            )
            
        if time_filter and time_filter != "ALL":
            now = datetime.now(timezone.utc)
            if time_filter == "TODAY":
                # Start of today (local time or UTC?) - Let's use UTC start of day for simplicity
                start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
                query = query.filter(Loan.start_time >= start_of_day)
            elif time_filter == "WEEK":
                week_ago = now - timedelta(days=7)
                query = query.filter(Loan.start_time >= week_ago)
            elif time_filter == "MONTH":
                month_ago = now - timedelta(days=30)
                query = query.filter(Loan.start_time >= month_ago)

        # Sorting
        # Map sort_by from frontend to model attributes
        sort_map = {
            "created_at": Loan.created_at,
            "start_time": Loan.start_time,
            "status": Loan.status,
            "hours": Loan.hours_earned
        }
        sort_attr = sort_map.get(sort_by, Loan.created_at)
        
        if order == "asc":
            query = query.order_by(sort_attr.asc())
        else:
            query = query.order_by(sort_attr.desc())

        total = query.count()
        loans = query.offset(skip).limit(limit).all()
        
        # Validar y auto-marcar Vencidos al VUELO si están Activos y ya pasó el tiempo
        now_utc = datetime.now(timezone.utc)
        dirty = False
        for l in loans:
            if l.status == "ACTIVO" and l.expected_return_time and now_utc > l.expected_return_time:
                l.status = "VENCIDO"
                dirty = True
        
        if dirty:
            db.commit()
            
        return {"items": loans, "total": total}

    @staticmethod
    def get_student_loans(db: Session, student_id: int) -> List[Loan]:
        """Obtiene todos los préstamos de un estudiante específico."""
        return db.query(Loan).filter(
            Loan.student_id == student_id
        ).order_by(Loan.created_at.desc()).all()
