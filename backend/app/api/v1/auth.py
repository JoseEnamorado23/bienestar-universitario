from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest, RegisterRequest, RefreshTokenRequest,
    VerifyEmailRequest, ForgotPasswordRequest,
    ResetPasswordRequest, ResendVerificationRequest,
    LoginResponse, TokenResponse, MessageResponse,
    MagicLinkResponse, ChangePasswordRequest
)
from app.schemas.users import UserResponse
from app.services.auth_service import AuthService
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.api.dependencies.permissions import require_super_admin 
router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=MessageResponse)
async def register_student(
    data: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Registra un nuevo estudiante
    - Envía magic link para verificar email
    - El estudiante queda INACTIVE hasta verificar
    """
    service = AuthService(db)
    user = service.register_student(data)
    
    # En producción, aquí se enviaría el email
    magic_link = f"{settings.FRONTEND_URL}/verify-email?token=..."  # Generado en service
    
    return MessageResponse(
        message="Registro exitoso. Revisa tu email para verificar tu cuenta",
        detail=f"Magic link enviado a {data.email}"  # Solo visible en desarrollo
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Inicio de sesión
    - Requiere email verificado
    - Devuelve access_token y refresh_token
    """
    service = AuthService(db)
    result = service.login(
        data,
        ip_address=request.client.host,
        device_info=request.headers.get("user-agent")
    )
    
    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=result["user"]
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtiene un nuevo access_token usando refresh_token
    """
    service = AuthService(db)
    result = service.refresh_token(data.refresh_token)
    
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=data.refresh_token,  # El mismo refresh token
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica email usando magic link
    """
    service = AuthService(db)
    user = service.verify_email(data.token)
    
    return MessageResponse(
        message=f"¡Bienvenido {user.first_name} {user.last_name}! Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión."
    )

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    data: ResendVerificationRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reenvía magic link de verificación
    """
    service = AuthService(db)
    # Reutilizamos forgot_password para reenviar? O creamos método específico
    service.forgot_password(data.email)  # Temporal
    
    return MessageResponse(
        message=f"Link de verificación reenviado a {data.email}"
    )

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Solicita recuperación de contraseña
    """
    service = AuthService(db)
    service.forgot_password(data.email)
    
    return MessageResponse(
        message="Si el email existe, recibirás instrucciones para recuperar tu contraseña"
    )

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Restablece contraseña usando token
    """
    service = AuthService(db)
    service.reset_password(data.token, data.new_password)
    
    return MessageResponse(
        message="Contraseña actualizada exitosamente"
    )

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambia la contraseña de un usuario autenticado
    """
    service = AuthService(db)
    service.change_password(current_user, data.current_password, data.new_password)
    
    return MessageResponse(
        message="Contraseña actualizada exitosamente"
    )

@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: RefreshTokenRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cierra sesión del usuario
    - Revoca el refresh token
    - Cierra sesiones activas
    """
    service = AuthService(db)
    refresh_token = data.refresh_token if data else None
    service.logout(current_user.id, refresh_token)
    
    return MessageResponse(
        message="Sesión cerrada exitosamente"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene información del usuario actual
    """
    from app.core.constants import PERMISSIONS
    
    if current_user.role and current_user.role.name == "super_admin":
        user_permissions = list(PERMISSIONS.keys())
    else:
        user_permissions = [rp.permission.code for rp in current_user.role.role_permissions] if current_user.role else []

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        role=current_user.role.name if current_user.role else None,
        permissions=user_permissions,
        status=current_user.status.value,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )

@router.get("/student-profile", response_model=dict)
async def get_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retorna datos del perfil estudiantil del usuario autenticado:
    horas completadas, horas requeridas (config), y préstamos activos.
    """
    from app.models.student import Student
    from app.models.loan import Loan
    from app.models.settings import SystemSetting

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return {
            "social_hours_completed": 0.0,
            "social_hours_required": 0,
            "active_loans": 0,
            "is_student": False,
        }

    # Horas requeridas desde configuración del sistema
    setting = db.query(SystemSetting).filter(SystemSetting.key == "SOCIAL_HOURS_REQUIRED").first()
    hours_required = int(setting.value) if setting else 0

    # Préstamos activos o solicitados
    active_loans = db.query(Loan).filter(
        Loan.student_id == student.id,
        Loan.status.in_(["ACTIVO", "SOLICITADO", "VENCIDO"])
    ).count()

    return {
        "social_hours_completed": round(student.social_hours_completed, 2),
        "social_hours_required": hours_required,
        "active_loans": active_loans,
        "is_student": True,
    }


@router.get("/super-admin-info", response_model=dict)
async def get_super_admin_info(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Información útil para el Super Admin (solo super_admin)
    """
    from app.models.user import User
    from app.models.role import Role
    from app.models.permission import Permission
    from app.models.student import Student
    
    total_admins = db.query(User).outerjoin(Student).filter(Student.id == None).count()
    total_students = db.query(User).join(Student).count()
    total_roles = db.query(Role).count()
    total_permissions = db.query(Permission).count()
    
    return {
        "stats": {
            "total_admins": total_admins,
            "total_students": total_students,
            "total_roles": total_roles,
            "total_permissions": total_permissions
        },
        "info": {
            "super_admin_email": "admin@bienestar.edu.co",
            "docs_url": "/api/docs",
            "redoc_url": "/api/redoc"
        }
    }    