from fastapi import Depends
from typing import List, Set
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.core.exceptions import InsufficientPermissionsException
from app.models.user import User
from app.models.permission import Permission
from app.core.database import get_db

class PermissionChecker:
    """
    Clase para verificar permisos de usuarios
    """
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        """
        Verifica si el usuario tiene todos los permisos requeridos
        """
        # Obtener todos los permisos del usuario (rol + permisos directos)
        user_permissions = get_user_permissions(current_user, db)
        
        # Verificar cada permiso requerido
        for perm in self.required_permissions:
            if perm not in user_permissions:
                raise InsufficientPermissionsException(
                    f"Se requiere permiso: {perm}"
                )
        
        return current_user

def require_permissions(permissions: List[str]):
    """
    Dependencia para requerir permisos específicos
    Uso: require_permissions(["user:create", "user:read"])
    """
    return PermissionChecker(permissions)

class PermissionAnyChecker:
    """
    Verifica si el usuario tiene AL MENOS UNO de los permisos requeridos (OR logic)
    """
    def __init__(self, allowed_permissions: List[str]):
        self.allowed_permissions = allowed_permissions
    
    def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        user_permissions = get_user_permissions(current_user, db)
        
        for perm in self.allowed_permissions:
            if perm in user_permissions:
                return current_user
                
        raise InsufficientPermissionsException(
            f"Se requiere al menos uno de estos permisos: {', '.join(self.allowed_permissions)}"
        )

def require_any_permissions(permissions: List[str]):
    """
    Dependencia para requerir al menos uno de los permisos listados
    """
    return PermissionAnyChecker(permissions)

def get_user_permissions(user: User, db: Session) -> Set[str]:
    """
    Obtiene todos los permisos efectivos de un usuario:
    - Permisos del rol
    - Permisos directos del usuario (user_permissions)
    """
    if user.role and user.role.name in ["super_admin", "super_administrador"]:
        from app.core.constants import PERMISSIONS
        return set(PERMISSIONS.keys())
        
    permissions = set()
    
    # Permisos del rol
    if user.role:
        for rp in user.role.role_permissions:
            permissions.add(rp.permission.code)
    
    # Permisos directos del usuario
    for up in user.user_permissions:
        if up.enabled:
            permissions.add(up.permission.code)
    
    return permissions

def has_permission(user: User, permission_code: str, db: Session) -> bool:
    """
    Verifica si un usuario tiene un permiso específico
    """
    permissions = get_user_permissions(user, db)
    return permission_code in permissions

class RoleChecker:
    """
    Clase para verificar roles de usuarios
    """
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(
        self,
        current_user: User = Depends(get_current_active_user)
    ) -> User:  # 👈 Cambiado de bool a User
        if current_user.role.name not in self.allowed_roles:
            raise InsufficientPermissionsException(
                f"Se requiere uno de estos roles: {', '.join(self.allowed_roles)}"
            )
        return current_user  # 👈 Retornar el usuario, no True

def require_roles(roles: List[str]):
    """
    Dependencia para requerir roles específicos
    Uso: require_roles(["super_admin", "admin_full"])
    """
    return RoleChecker(roles)

# ==========================
# Verificaciones específicas
# ==========================

def require_super_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:  # 👈 Cambiado de bool a User
    """
    Verifica que el usuario sea Super Admin y retorna el usuario
    """
    if current_user.role.name not in ["super_admin", "super_administrador"]:
        raise InsufficientPermissionsException(
            "Solo Super Admin puede realizar esta acción"
        )
    return current_user  # 👈 Retornar el usuario, no True

def can_manage_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> bool:
    """
    Verifica si el usuario puede gestionar usuarios
    """
    required = ["user:read:all", "user:create:admin"]
    for perm in required:
        if has_permission(current_user, perm, db):
            return True
    
    raise InsufficientPermissionsException(
        "No tienes permisos para gestionar usuarios"
    )