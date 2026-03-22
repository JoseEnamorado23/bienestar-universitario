from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.core.constants import UserStatus

# ==========================
# User Schemas
# ==========================

class UserBase(BaseModel):
    """Base schema para usuario"""
    email: EmailStr
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE
    role_id: int

class UserCreate(UserBase):
    """Schema para crear usuario"""
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    status: Optional[UserStatus] = None
    role_id: Optional[int] = None
    password: Optional[str] = Field(None, min_length=6)

class UserInDB(UserBase):
    """Schema para usuario en BD"""
    id: int
    is_verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    """Schema para respuesta de usuario"""
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str]
    role: str
    permissions: list[str] = []
    status: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================
# Student Schemas (simplificado)
# ==========================

class StudentBase(BaseModel):
    """Base schema para estudiante"""
    national_id: str
    program_id: Optional[int] = None

class StudentCreate(StudentBase):
    """Schema para crear estudiante"""
    user_id: Optional[int] = None

class StudentUpdate(BaseModel):
    """Schema para actualizar estudiante"""
    national_id: Optional[str] = None
    program_id: Optional[int] = None

class StudentInDB(StudentBase):
    """Schema para estudiante en BD"""
    id: int
    user_id: int
    social_hours_completed: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    """Schema para respuesta de estudiante"""
    id: int
    user_id: int
    email: EmailStr
    first_name: str  # ← Viene de User
    last_name: str   # ← Viene de User
    phone: Optional[str]  # ← Viene de User
    national_id: str
    program_name: Optional[str]
    social_hours_completed: float
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True