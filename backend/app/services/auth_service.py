from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from app.models.user import User
from app.models.student import Student
from app.models.token import AuthToken
from app.models.role import Role
from app.models.program import Program
from app.models.session import Session as UserSession
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    create_magic_link_token, verify_token
)
from app.core.config import settings
from app.core.exceptions import (
    InvalidCredentialsException,
    AccountNotVerifiedException,
    NotFoundException,
    AlreadyExistsException,
    InvalidTokenException
)
from app.core.constants import UserStatus
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthService:
    """Servicio de autenticación"""

    def __init__(self, db: Session):
        self.db = db

    def register_student(self, data: RegisterRequest) -> User:
        """
        Registra un nuevo estudiante
        """
        # Verificar si el email ya existe
        existing_user = self.db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_user:
            raise AlreadyExistsException("Usuario", f"Email {data.email} ya está registrado")

        # Verificar si el documento ya existe
        existing_student = self.db.query(Student).filter(
            Student.national_id == data.national_id
        ).first()

        if existing_student:
            raise AlreadyExistsException("Estudiante", f"Documento {data.national_id} ya está registrado")

        # Buscar el rol de estudiante
        student_role = self.db.query(Role).filter(Role.name == "estudiante").first()
        if not student_role:
            # Si no existe, crearlo (por si acaso)
            student_role = Role(
                name="estudiante",
                description="Usuario estudiante",
                is_system_role=True
            )
            self.db.add(student_role)
            self.db.flush()
            print("✅ Rol 'estudiante' creado automáticamente")

        # Verificar programa si se proporcionó
        program = None
        if data.program_id:
            program = self.db.query(Program).filter(
                Program.id == data.program_id,
                Program.is_active == True
            ).first()
            if not program:
                raise NotFoundException("Programa", str(data.program_id))

        # Crear usuario con datos personales
        user = User(
            email=data.email,
            password=get_password_hash(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            status=UserStatus.INACTIVE,
            is_verified=False,
            role_id=student_role.id
        )
        self.db.add(user)
        self.db.flush()  # Para obtener el ID

        # Crear estudiante SOLO con datos específicos
        student = Student(
            user_id=user.id,
            national_id=data.national_id,
            program_id=data.program_id
        )
        self.db.add(student)

        # Crear magic link token
        magic_token = self._create_magic_link_token(user.email)

        self.db.commit()

        # Enviar email con el magic link
        from app.utils.email import send_verification_email
        send_verification_email(
            to_email=data.email, 
            subject="Verificación de cuenta - Estudiante", 
            token=magic_token, 
            is_admin=False
        )

        return user

    def login(self, data: LoginRequest, ip_address: str = None, device_info: str = None) -> Dict[str, Any]:
        """
        Inicio de sesión
        """
        # Buscar usuario por email
        user = self.db.query(User).filter(User.email == data.email).first()

        if not user:
            raise InvalidCredentialsException("Email o contraseña incorrectos")

        # Verificar contraseña
        if not verify_password(data.password, user.password):
            raise InvalidCredentialsException("Email o contraseña incorrectos")

        # Verificar estado del usuario
        if user.status == UserStatus.INACTIVE:
            raise AccountNotVerifiedException()

        if user.status == UserStatus.SUSPENDED:
            raise InvalidCredentialsException("Cuenta suspendida")

        # Crear tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # Guardar refresh token en BD
        self._save_refresh_token(user.id, refresh_token)

        # Crear sesión
        self._create_session(user.id, ip_address, device_info)

        from app.core.constants import PERMISSIONS
        if user.role and user.role.name == "super_admin":
            user_permissions = list(PERMISSIONS.keys())
        else:
            user_permissions = [rp.permission.code for rp in user.role.role_permissions] if user.role else []

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.name if user.role else None,
                "permissions": user_permissions,
                "status": user.status.value,
                "is_verified": user.is_verified
            }
        }

    def refresh_token(self, token: str) -> Dict[str, Any]:
        """
        Refresca el token de acceso usando el token de refresco
        """
        # Verificar el token
        payload = verify_token(token, "refresh")
        if not payload:
            raise InvalidTokenException("Token de refresco inválido o expirado")
            
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenException("Token mal formado")
            
        # Verificar que el token exista en BD y no esté revocado
        existing_token = self.db.query(AuthToken).filter(
            AuthToken.token_hash == token,
            AuthToken.type == "refresh",
            AuthToken.is_revoked == False
        ).first()
        
        if not existing_token:
            raise InvalidTokenException("Token de refresco revocado o no encontrado")
            
        # Buscar usuario
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise NotFoundException("Usuario")
            
        if user.status != UserStatus.ACTIVE:
            raise InvalidCredentialsException("Usuario no activo")
            
        # Crear nuevo access token
        access_token = create_access_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token
        }

    def change_password(self, user: User, current_password: str, new_password: str):
        """
        Cambia la contraseña de un usuario autenticado
        """
        # Verificar la contraseña actual
        if not verify_password(current_password, user.password):
            raise InvalidCredentialsException("La contraseña actual es incorrecta")
            
        # Actualizar contraseña
        user.password = get_password_hash(new_password)
        self.db.commit()
        
        return True

    def verify_email(self, token: str) -> User:
        """
        Verifica email usando magic link
        """
        print(f"Verificando token: {token[:50]}...")

        # Verificar token
        payload = verify_token(token, "magic_link")
        if not payload:
            print("❌ Token inválido o expirado")
            raise InvalidTokenException()

        print(f"✅ Payload recibido: {payload}")

        # El token tiene el email en "sub"
        email = payload.get("sub")

        if not email:
            print("❌ No hay email en el payload")
            raise InvalidTokenException()

        print(f"📧 Email extraído: {email}")

        # Buscar usuario por email
        user = self.db.query(User).filter(
            User.email == email
        ).first()

        if not user:
            print(f"❌ Usuario no encontrado: {email}")
            raise NotFoundException("Usuario")

        print(f"✅ Usuario encontrado: ID {user.id} - Status actual: {user.status}")

        # Verificar que el token no haya sido usado ya
        existing_token = self.db.query(AuthToken).filter(
            AuthToken.token_hash == token,
            AuthToken.type == "magic_link",
            AuthToken.is_revoked == False
        ).first()

        if not existing_token:
            print("❌ Token no encontrado en BD o ya revocado")
            raise InvalidTokenException()

        print("✅ Token válido en BD")

        # Activar y verificar usuario
        user.status = UserStatus.ACTIVE
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        print("✅ Usuario activado y verificado")

        # Invalidar token usado
        existing_token.is_revoked = True
        print("✅ Token revocado")

        self.db.commit()
        self.db.refresh(user)

        print(f"✅ Proceso completado. Usuario {user.email} - Status: {user.status}")

        return user

    def logout(self, user_id: int, refresh_token: str = None):
        """
        Cierra sesión del usuario
        - Revoca el refresh token actual (si existe)
        - Invalida la sesión actual en BD
        """
        if refresh_token:
            # Revocar el token específico
            token_record = self.db.query(AuthToken).filter(
                AuthToken.token_hash == refresh_token,
                AuthToken.user_id == user_id,
                AuthToken.type == "refresh"
            ).first()
            
            if token_record:
                token_record.is_revoked = True
                
        # Opcional: Invalidar sesión en UserSession
        # (Esto dependería de cómo manejemos el token de auth real o session ID extraído de request)
        
        self.db.commit()
        return True

    # ==========================
    # Métodos privados
    # ==========================

    def _create_magic_link_token(self, email: str) -> str:
        """
        Crea y guarda un magic link token
        """
        token = create_magic_link_token(email)

        # Buscar usuario por email para obtener user_id
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            raise NotFoundException("Usuario", email)

        # Guardar en BD
        auth_token = AuthToken(
            user_id=user.id,
            token_hash=token,
            type="magic_link",
            expires_at=datetime.utcnow() + timedelta(hours=settings.MAGIC_LINK_EXPIRE_HOURS)
        )
        self.db.add(auth_token)

        return token

    def _save_refresh_token(self, user_id: int, token: str):
        """
        Guarda refresh token en BD
        """
        auth_token = AuthToken(
            user_id=user_id,
            token_hash=token,
            type="refresh",
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(auth_token)
        self.db.commit()

    def _create_session(self, user_id: int, ip_address: str, device_info: str):
        """
        Crea una sesión de usuario
        """
        session = UserSession(
            user_id=user_id,
            ip_address=ip_address,
            device_info=device_info,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(session)
        self.db.commit()