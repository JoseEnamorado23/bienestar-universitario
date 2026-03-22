from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ==========================
# Request Schemas
# ==========================

class LoginRequest(BaseModel):
    """Schema para inicio de sesión"""
    email: EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    """Schema para registro de estudiante"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    national_id: str = Field(..., min_length=5, max_length=20)
    program_id: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    """Schema para refrescar token"""
    refresh_token: str

class VerifyEmailRequest(BaseModel):
    """Schema para verificar email con magic link"""
    token: str

class ForgotPasswordRequest(BaseModel):
    """Schema para solicitar recuperación de contraseña"""
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    """Schema para restablecer contraseña"""
    token: str
    new_password: str = Field(..., min_length=6)

class ResendVerificationRequest(BaseModel):
    """Schema para reenviar link de verificación"""
    email: EmailStr

class ChangePasswordRequest(BaseModel):
    """Schema para cambiar contraseña estando autenticado"""
    current_password: str
    new_password: str = Field(..., min_length=6)

# ==========================
# Response Schemas
# ==========================

class TokenResponse(BaseModel):
    """Schema para respuesta de tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos

class UserInfo(BaseModel):
    """Información básica del usuario"""
    id: int
    email: EmailStr
    role: str
    permissions: list[str] = []
    status: str

class LoginResponse(BaseModel):
    """Schema para respuesta de login exitoso"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserInfo

class MessageResponse(BaseModel):
    """Schema para respuestas simples con mensaje"""
    message: str
    detail: Optional[str] = None

class MagicLinkResponse(BaseModel):
    """Schema para respuesta de magic link (solo desarrollo)"""
    message: str
    link: Optional[str] = None  # Solo visible en desarrollo