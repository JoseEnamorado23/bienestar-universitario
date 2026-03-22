from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgramBase(BaseModel):
    """Base schema para programa"""
    name: str
    is_active: bool = True

class ProgramCreate(ProgramBase):
    """Schema para crear programa"""
    pass

class ProgramUpdate(BaseModel):
    """Schema para actualizar programa"""
    name: Optional[str] = None
    is_active: Optional[bool] = None

class ProgramResponse(ProgramBase):
    """Schema para respuesta de programa"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProgramWithStudents(ProgramResponse):
    """Schema para programa con conteo de estudiantes"""
    student_count: int