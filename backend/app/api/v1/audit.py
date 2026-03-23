from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.permissions import require_permissions
from app.models.user import User
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Auditoría"])


@router.get("/logs")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(require_permissions(["system:audit_logs"])),
    db: Session = Depends(get_db),
):
    """
    Obtiene los registros de auditoría con filtros y paginación.
    Solo accesible para usuarios con permiso system:audit:logs.
    """
    result = AuditService.get_audit_logs(
        db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )
    return result


@router.get("/stats")
async def get_audit_stats(
    current_user: User = Depends(require_permissions(["system:audit_logs"])),
    db: Session = Depends(get_db),
):
    """
    Resumen de actividad del sistema: conteos por acción y usuarios más activos.
    """
    return AuditService.get_stats(db)


@router.get("/actions")
async def get_audit_actions(
    current_user: User = Depends(require_permissions(["system:audit_logs"])),
    db: Session = Depends(get_db),
):
    """
    Retorna la lista de tipos de acción que existen en los logs.
    """
    from app.models.audit import AuditLog
    from sqlalchemy import distinct

    actions = db.query(distinct(AuditLog.action)).all()
    return [a[0] for a in actions if a[0]]
