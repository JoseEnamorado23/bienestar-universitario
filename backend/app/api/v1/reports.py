from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies.permissions import require_permissions, has_permission
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User
from app.services.report_service import ReportService
from app.services.audit_service import AuditService

router = APIRouter()

FIELD_LABELS_STUDENTS = {
    "id": "ID",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "national_id": "Identificación",
    "email": "Correo",
    "phone": "Teléfono",
    "program_name": "Programa",
    "social_hours_completed": "Horas",
    "status": "Estado",
    "created_at": "Fecha Registro"
}

FIELD_LABELS_LOANS = {
    "first_name": "Nombre Estudiante",
    "last_name": "Apellido Estudiante",
    "national_id": "Identificación",
    "program_name": "Programa",
    "item_name": "Implemento",
    "status": "Estado",
    "start_time": "Inicio",
    "returned_time": "Devolución",
    "hours_earned": "Horas",
    "issuer_name": "Aprobado",
    "created_at": "Fecha Solicitud"
}

FIELD_LABELS_ACTIVITIES = {
    "id": "ID",
    "activity_title": "Actividad",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "national_id": "Identificación",
    "program_name": "Programa",
    "hours_earned": "Horas",
    "scanned_at": "Fecha Escaneo",
    "event_datetime": "Fecha Evento",
    "activity_status": "Estado Actividad"
}

@router.get("/students")
def get_students_report_preview(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["report:students"]))
) -> Any:
    return ReportService.build_students_query(
        db, skip=skip, limit=limit, search=search, program_id=program_id, status=status,
        date_from=date_from, date_to=date_to, sort_by=sort_by, order=order
    )

@router.get("/loans")
def get_loans_report_preview(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["report:loans"]))
) -> Any:
    return ReportService.build_loans_query(
        db, skip=skip, limit=limit, search=search, program_id=program_id, status=status,
        date_from=date_from, date_to=date_to, sort_by=sort_by, order=order
    )

@router.get("/activities")
def get_activities_report_preview(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["report:activities"]))
) -> Any:
    return ReportService.build_activities_query(
        db, skip=skip, limit=limit, search=search, program_id=program_id, status=status,
        date_from=date_from, date_to=date_to, sort_by=sort_by, order=order
    )

@router.get("/download")
def download_report(
    type: str = Query(..., description="students, loans or activities"),
    format: str = Query(..., description="csv, excel, pdf"),
    fields: str = Query(..., description="comma separated list of fields"),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    activity_id: Optional[int] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if type not in ["students", "loans", "activities"]:
        raise HTTPException(status_code=400, detail="Tipo de reporte inválido.")
        
    if type == "students" and not has_permission(current_user, "report:students", db):
        raise HTTPException(status_code=403, detail="No tienes permiso para generar reportes de estudiantes.")
    elif type == "loans" and not has_permission(current_user, "report:loans", db):
        raise HTTPException(status_code=403, detail="No tienes permiso para generar reportes de préstamos.")
    elif type == "activities" and not has_permission(current_user, "report:activities", db):
        raise HTTPException(status_code=403, detail="No tienes permiso para generar reportes de actividades.")
        
    if format not in ["csv", "excel", "pdf"]:
        raise HTTPException(status_code=400, detail="Formato inválido.")
        
    field_list = [f.strip() for f in fields.split(",") if f.strip()]
    if not field_list:
        raise HTTPException(status_code=400, detail="Debe especificar al menos un campo.")
        
    if type == "students":
        data = ReportService.build_students_query(
            db, skip=0, limit=10000, search=search, program_id=program_id, status=status,
            date_from=date_from, date_to=date_to, sort_by=sort_by, order=order
        )["items"]
        field_labels = FIELD_LABELS_STUDENTS
        title = "Reporte de Estudiantes"
    elif type == "loans":
        data = ReportService.build_loans_query(
            db, skip=0, limit=10000, search=search, program_id=program_id, status=status,
            date_from=date_from, date_to=date_to, sort_by=sort_by, order=order
        )["items"]
        field_labels = FIELD_LABELS_LOANS
        title = "Reporte de Prestamos"
    else:
        data = ReportService.build_activities_query(
            db, skip=0, limit=10000, search=search, program_id=program_id, status=status,
            date_from=date_from, date_to=date_to, activity_id=activity_id, sort_by=sort_by, order=order
        )["items"]
        field_labels = FIELD_LABELS_ACTIVITIES
        title = "Reporte de Asistencia a Actividades"
        if data and activity_id:
            title = f"Asistencia: {data[0].get('activity_title', 'Actividad')}"
        
    AuditService.log_action(
        db, action=f"GENERATE_REPORT_{type.upper()}", entity_type="report", entity_id=current_user.id,
        user_id=current_user.id,
        details={"format": format, "fields": field_list}
    )

    metadata = None
    if type == "activities" and activity_id and data:
        act = data[0]
        evt_date = act.get('event_datetime', '—')
        if 'T' in evt_date: evt_date = evt_date.split('T')[0]
        h_val = act.get('hours_reward', 0)
        h_int = int(h_val)
        m_int = int(round((h_val - h_int) * 60))
        metadata = {
            "Lugar": act.get('location', '—'),
            "Fecha": evt_date,
            "Horas Recompensa": f"{h_int:02d}:{m_int:02d} h"
        }

    if format == "csv":
        return ReportService.export_csv(data, field_list, field_labels)
    elif format == "excel":
        return ReportService.export_excel(data, field_list, field_labels)
    elif format == "pdf":
        return ReportService.export_pdf(data, field_list, field_labels, title, current_user, metadata=metadata)
