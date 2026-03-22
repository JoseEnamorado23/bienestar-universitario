from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class SystemSettingBase(BaseModel):
    """Base schema para configuración del sistema"""
    key: str
    value: str
    description: Optional[str] = None
    is_public: bool = False

class SystemSettingCreate(SystemSettingBase):
    """Schema para crear configuración"""
    pass

class SystemSettingUpdate(BaseModel):
    """Schema para actualizar configuración"""
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class SystemSettingResponse(SystemSettingBase):
    """Schema para respuesta de configuración"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SocialHoursConfigBase(BaseModel):
    """Base schema para configuración de horas sociales"""
    required_hours: int
    description: Optional[str] = None
    is_active: bool = True

class SocialHoursConfigCreate(SocialHoursConfigBase):
    """Schema para crear configuración de horas"""
    pass

class SocialHoursConfigResponse(SocialHoursConfigBase):
    """Schema para respuesta de configuración de horas"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True