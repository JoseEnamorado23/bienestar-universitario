from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ==========================
# Permission Schemas
# ==========================

class PermissionBase(BaseModel):
    """Base schema para permiso"""
    code: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    """Schema para crear permiso"""
    pass

class PermissionResponse(PermissionBase):
    """Schema para respuesta de permiso"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================
# Role Schemas
# ==========================

class RoleBase(BaseModel):
    """Base schema para rol"""
    name: str
    description: Optional[str] = None
    is_system_role: bool = False

class RoleCreate(RoleBase):
    """Schema para crear rol"""
    permission_ids: Optional[List[int]] = []

class RoleUpdate(BaseModel):
    """Schema para actualizar rol"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_system_role: Optional[bool] = None
    permission_ids: Optional[List[int]] = None

class RoleResponse(RoleBase):
    """Schema para respuesta de rol"""
    id: int
    created_at: datetime
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class RoleWithUsers(RoleResponse):
    """Schema para rol con usuarios"""
    user_count: int

# ==========================
# Role-Permission Assignment
# ==========================

class RolePermissionAssignment(BaseModel):
    """Schema para asignar permisos a rol"""
    permission_ids: List[int]

class UserPermissionAssignment(BaseModel):
    """Schema para asignar permisos a usuario"""
    permission_ids: List[int]
    enabled: bool = True