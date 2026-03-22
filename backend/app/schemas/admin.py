from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.core.constants import UserStatus

# ==========================
# Request Schemas
# ==========================

class AdminCreateRequest(BaseModel):
    """Schema para crear un nuevo administrador"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    national_id: str = Field(..., min_length=5, max_length=20, description="Cédula de ciudadanía")
    phone: Optional[str] = None
    role_id: int

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@ejemplo.com",
                "password": "123456",
                "first_name": "Admin",
                "last_name": "Ejemplo",
                "phone": "3001234567",
                "role_id": 2
            }
        }

class AdminUpdateRequest(BaseModel):
    """Schema para actualizar administrador"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    status: Optional[UserStatus] = None

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "AdminModificado",
                "phone": "3009998877"
            }
        }

class AdminChangeRoleRequest(BaseModel):
    """Schema para cambiar rol de administrador"""
    role_id: int

    class Config:
        json_schema_extra = {
            "example": {
                "role_id": 3
            }
        }

class AdminPermissionsUpdateRequest(BaseModel):
    """Schema para actualizar permisos de administrador"""
    permission_ids: List[int]
    enabled: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "permission_ids": [1, 2, 3],
                "enabled": True
            }
        }

class AdminRolePermissionUpdateRequest(BaseModel):
    """Schema para actualizar rol y permisos de una sola vez"""
    role_id: int
    direct_permission_ids: List[int]

    class Config:
        json_schema_extra = {
            "example": {
                "role_id": 2,
                "direct_permission_ids": [4, 5]
            }
        }

class AdminStatusUpdateRequest(BaseModel):
    """Schema para actualizar estado de administrador"""
    status: UserStatus
    reason: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "status": "SUSPENDED",
                "reason": "Prueba de suspensión"
            }
        }

# ==========================
# Response Schemas
# ==========================

class AdminPermissionResponse(BaseModel):
    """Schema para permiso de administrador"""
    id: int
    code: str
    description: Optional[str]
    granted_via: str  # "role" o "direct"

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "code": "user:read:all",
                "description": "Ver todos los usuarios",
                "granted_via": "role"
            }
        }

class AdminResponse(BaseModel):
    """Schema para respuesta de administrador"""
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    national_id: Optional[str] = None
    phone: Optional[str] = None
    role_id: int
    role_name: str
    status: UserStatus
    is_verified: bool
    permissions: List[AdminPermissionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "admin@ejemplo.com",
                "first_name": "Admin",
                "last_name": "Ejemplo",
                "phone": "3001234567",
                "role_id": 2,
                "role_name": "admin_full",
                "status": "ACTIVE",
                "is_verified": True,
                "permissions": [],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }

class AdminListResponse(BaseModel):
    """Schema para listar administradores"""
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    national_id: Optional[str] = None
    role_id: Optional[int]
    role_name: str
    status: UserStatus
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "admin@ejemplo.com",
                "first_name": "Admin",
                "last_name": "Ejemplo",
                "role_name": "super_admin",
                "status": "ACTIVE",
                "is_verified": True,
                "created_at": "2024-01-01T00:00:00"
            }
        }

class RolePermissionDetailResponse(BaseModel):
    """Schema para detalle de rol con permisos"""
    id: int
    name: str
    description: Optional[str]
    is_system_role: bool
    permissions: List[dict]  # Lista de permisos con código y descripción
    user_count: int

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "super_admin",
                "description": "Acceso total al sistema",
                "is_system_role": True,
                "permissions": [
                    {"id": 1, "code": "user:create:admin", "description": "Crear administradores"}
                ],
                "user_count": 1
            }
        }