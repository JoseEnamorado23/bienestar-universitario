from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from jose import JWTError

from app.core.database import get_db
from app.core.security import verify_token
from app.core.exceptions import (
    InvalidCredentialsException,
    InvalidTokenException,
    TokenExpiredException,
    InsufficientPermissionsException,
    AccountNotVerifiedException
)
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.core.constants import UserStatus

# Esquema de seguridad para Bearer token
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario actual a partir del token JWT
    """
    token = credentials.credentials
    
    # Verificar token
    payload = verify_token(token, "access")
    if not payload:
        raise InvalidTokenException()
    
    # Obtener user_id del payload
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenException()
    
    try:
        user_id = int(user_id)
    except ValueError:
        raise InvalidTokenException()
    
    # Buscar usuario en BD
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise InvalidCredentialsException("Usuario no encontrado")
    
    # Verificar estado del usuario
    if user.status == UserStatus.INACTIVE:
        raise AccountNotVerifiedException()
    
    if user.status == UserStatus.SUSPENDED:
        raise InvalidCredentialsException("Cuenta suspendida")
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica que el usuario esté activo
    """
    if current_user.status != UserStatus.ACTIVE:
        raise AccountNotVerifiedException()
    return current_user

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Obtiene el usuario actual si hay token, sino retorna None
    Útil para endpoints que pueden ser públicos o privados
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = verify_token(token, "access")
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    try:
        user_id = int(user_id)
    except ValueError:
        return None
    
    return db.query(User).filter(User.id == user_id).first()