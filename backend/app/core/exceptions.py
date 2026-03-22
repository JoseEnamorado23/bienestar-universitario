from fastapi import HTTPException, status
from typing import Optional, Dict, Any

class BaseAPIException(HTTPException):
    """Excepción base para la API"""
    def __init__(
        self,
        status_code: int,
        detail: str = None,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

# ==========================
# EXCEPCIONES DE AUTENTICACIÓN
# ==========================

class InvalidCredentialsException(BaseAPIException):
    """Credenciales inválidas"""
    def __init__(self, detail: str = "Credenciales inválidas"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

class TokenExpiredException(BaseAPIException):
    """Token expirado"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ha expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

class InvalidTokenException(BaseAPIException):
    """Token inválido"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"}
        )

class InsufficientPermissionsException(BaseAPIException):
    """Permisos insuficientes"""
    def __init__(self, detail: str = "No tienes permisos para realizar esta acción"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

# ==========================
# EXCEPCIONES DE RECURSOS
# ==========================

class NotFoundException(BaseAPIException):
    """Recurso no encontrado"""
    def __init__(self, resource: str = "Recurso", resource_id: Optional[str] = None):
        detail = f"{resource} no encontrado"
        if resource_id:
            detail += f" con ID: {resource_id}"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class AlreadyExistsException(BaseAPIException):
    """Recurso ya existe"""
    def __init__(self, resource: str = "Recurso", detail: Optional[str] = None):
        if not detail:
            detail = f"{resource} ya existe"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )

# ==========================
# EXCEPCIONES DE NEGOCIO
# ==========================

class AccountLockedException(BaseAPIException):
    """Cuenta bloqueada por intentos fallidos"""
    def __init__(self, minutes: int):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta bloqueada por {minutes} minutos debido a múltiples intentos fallidos"
        )

class AccountNotVerifiedException(BaseAPIException):
    """Cuenta no verificada"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta no verificada. Por favor verifica tu email"
        )