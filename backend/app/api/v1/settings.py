from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import update
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.permissions import require_super_admin
from app.models.settings import SystemSetting
from pydantic import BaseModel

router = APIRouter()

class SettingUpdateRequest(BaseModel):
    key: str
    value: str

@router.get("", response_model=List[dict])
def get_system_settings(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Obtener todas las configuraciones del sistema.
    Los usuarios autenticados pueden verlas, pero típicamente 
    es más relevante para el dashboard.
    """
    settings = db.query(SystemSetting).all()
    return [{"key": s.key, "value": s.value, "description": s.description, "is_public": s.is_public} for s in settings]

@router.patch("", response_model=dict)
def update_system_settings(
    updates: List[SettingUpdateRequest],
    db: Session = Depends(get_db),
    current_admin: Any = Depends(require_super_admin), # Solo super admin puede editar
):
    """
    Actualizar configuraciones del sistema en lote (batch).
    """
    for config in updates:
        # Check if exists
        setting = db.query(SystemSetting).filter(SystemSetting.key == config.key).first()
        if setting:
            setting.value = config.value
        else:
            # Optionally create if doesn't exist? For now let's just create if missing
            db.add(SystemSetting(key=config.key, value=config.value))
    
    db.commit()
    return {"message": "Configuraciones actualizadas exitosamente"}
