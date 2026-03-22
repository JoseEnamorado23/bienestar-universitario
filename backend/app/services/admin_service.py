from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, String, cast
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.user import User, UserPermission
from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.models.student import Student
from app.models.audit import AuditLog
from app.core.security import get_password_hash
from app.core.exceptions import (
    NotFoundException,
    AlreadyExistsException,
    InsufficientPermissionsException,
    InvalidCredentialsException
)
from app.core.constants import UserStatus
from app.schemas.admin import (
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminChangeRoleRequest,
    AdminPermissionsUpdateRequest,
    AdminStatusUpdateRequest
)


class AdminService:
    """Servicio para administración de usuarios"""

    def __init__(self, db: Session):
        self.db = db

    # ==========================
    # Gestión de Administradores
    # ==========================

    def create_admin(self, data: AdminCreateRequest, created_by_id: int) -> User:
        """
        Crea un nuevo administrador (solo super_admin)
        """
        # Verificar si el email ya existe
        existing_user = self.db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_user:
            raise AlreadyExistsException("Usuario", f"Email {data.email} ya está registrado")

        # Verificar que el rol existe y es de admin
        role = self.db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise NotFoundException("Rol", str(data.role_id))

        # Verificar que no se asigne rol de estudiante
        if role.name == "estudiante":
            raise InvalidCredentialsException("No se puede asignar rol de estudiante a un administrador")

        # Crear usuario con todos los campos
        user = User(
            email=data.email,
            password=get_password_hash(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            national_id=data.national_id,
            phone=data.phone,
            status=UserStatus.INACTIVE,  # Comenzar como inactivo
            is_verified=False,           # Requiere verificación
            role_id=role.id
        )
        self.db.add(user)
        self.db.flush()

        # Generar magic link para verificación de email (igual que los estudiantes)
        from app.core.security import create_magic_link_token
        from app.models.token import AuthToken
        from datetime import timedelta
        from app.core.config import settings
        
        token = create_magic_link_token(user.email)
        
        auth_token = AuthToken(
            user_id=user.id,
            token_hash=token,
            type="magic_link",
            expires_at=datetime.utcnow() + timedelta(hours=settings.MAGIC_LINK_EXPIRE_HOURS)
        )
        self.db.add(auth_token)

        # Registrar en audit log
        self._create_audit_log(
            user_id=created_by_id,
            action=f"CREATE_ADMIN: Created admin {data.first_name} {data.last_name} with role {role.name}",
            entity_type="user",
            entity_id=user.id
        )

        self.db.commit()
        self.db.refresh(user)

        # Enviar email con el magic link
        from app.utils.email import send_verification_email
        send_verification_email(
            to_email=data.email, 
            subject="Verificación de cuenta - Administrador", 
            token=token, 
            is_admin=True
        )

        return user

    def get_admins(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        search: str = None,
        role_id: Optional[int] = None,
        status: Optional[str] = None,
        sort_by: str = "id",
        order: str = "desc"
    ) -> dict:
        """
        Lista todos los administradores (excluye estudiantes según su perfil)
        con soporte para filtros, ordenamiento y paginación.
        """
        # Excluir usuarios que tengan un perfil de estudiante
        query = self.db.query(User).outerjoin(Student).filter(
            Student.id == None
        )

        if search:
            search_query = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_query),
                    User.first_name.ilike(search_query),
                    User.last_name.ilike(search_query),
                    User.national_id.ilike(search_query),
                    cast(User.id, String).ilike(search_query)
                )
            )

        if role_id:
            query = query.filter(User.role_id == role_id)
        
        if status:
            query = query.filter(User.status == status)

        # Contar total de administradores antes de paginar
        total = query.count()

        # Ordenamiento dinámico
        sort_map = {
            "id": User.id,
            "first_name": User.first_name,
            "last_name": User.last_name,
            "email": User.email,
            "status": User.status,
            "role": User.role_id,
            "created_at": User.created_at
        }

        sort_attr = sort_map.get(sort_by, User.id)
        
        if order == "desc":
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())

        items = query.offset(skip).limit(limit).all()

        return {
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    def get_students(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        search: str = None,
        program_id: Optional[int] = None,
        status: Optional[UserStatus] = None,
        sort_by: str = "id",
        order: str = "desc"
    ) -> Dict[str, Any]:
        """
        Lista todos los estudiantes con filtros, ordenamiento y paginación
        """
        # Solo usuarios que tengan un perfil de estudiante
        query = self.db.query(User).join(Student).options(joinedload(User.student).joinedload(Student.program))

        # Filtros básicos
        if status:
            query = query.filter(User.status == status)
        
        if program_id:
            query = query.filter(Student.program_id == program_id)

        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    cast(User.id, String).ilike(f"%{search}%"),
                    User.first_name.ilike(f"%{search}%"),
                    User.last_name.ilike(f"%{search}%"),
                    Student.national_id.ilike(f"%{search}%")
                )
            )

        # Contador total antes de paginación
        total = query.count()

        # Ordenamiento dinámico
        # Mapeo de campos de ordenamiento a atributos de modelo
        sort_map = {
            "id": User.id,
            "first_name": User.first_name,
            "last_name": User.last_name,
            "email": User.email,
            "status": User.status,
            "national_id": Student.national_id,
            "social_hours_completed": Student.social_hours_completed,
            "created_at": User.created_at
        }

        sort_attr = sort_map.get(sort_by, User.id)
        
        if order == "desc":
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())

        items = query.offset(skip).limit(limit).all()

        return {
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    def get_admin_by_id(self, admin_id: int) -> User:
        """
        Obtiene un administrador por ID
        """
        admin = self.db.query(User).outerjoin(Student).filter(
            User.id == admin_id,
            Student.id == None
        ).first()

        if not admin:
            raise NotFoundException("Administrador", str(admin_id))

        return admin

    def update_admin(self, admin_id: int, data: AdminUpdateRequest, updated_by_id: int) -> User:
        """
        Actualiza datos de un administrador
        """
        admin = self.get_admin_by_id(admin_id)

        # Actualizar email si se proporciona
        if data.email is not None:
            # Verificar que el email no esté en uso
            existing = self.db.query(User).filter(
                User.email == data.email,
                User.id != admin_id
            ).first()
            if existing:
                raise AlreadyExistsException("Usuario", f"Email {data.email} ya está registrado")
            admin.email = data.email

        # Actualizar nombre si se proporciona
        if data.first_name is not None:
            admin.first_name = data.first_name

        # Actualizar apellido si se proporciona
        if data.last_name is not None:
            admin.last_name = data.last_name

        # Actualizar teléfono si se proporciona
        if data.phone is not None:
            admin.phone = data.phone

        # Actualizar estado si se proporciona
        if data.status is not None:
            admin.status = data.status

        # Registrar en audit log
        self._create_audit_log(
            user_id=updated_by_id,
            action=f"UPDATE_ADMIN: Updated admin {admin.email}",
            entity_type="user",
            entity_id=admin.id
        )

        self.db.commit()
        self.db.refresh(admin)

        return admin

    def change_admin_role(self, admin_id: int, data: AdminChangeRoleRequest, changed_by_id: int) -> User:
        """
        Cambia el rol de un administrador
        """
        admin = self.get_admin_by_id(admin_id)

        # Verificar que el nuevo rol existe
        new_role = self.db.query(Role).filter(Role.id == data.role_id).first()
        if not new_role:
            raise NotFoundException("Rol", str(data.role_id))

        # Verificar que no se asigne rol de estudiante
        if new_role.name == "estudiante":
            raise InvalidCredentialsException("No se puede asignar rol de estudiante a un administrador")

        old_role_name = admin.role.name if admin.role else "None"
        admin.role_id = new_role.id

        # Registrar en audit log
        self._create_audit_log(
            user_id=changed_by_id,
            action=f"CHANGE_ADMIN_ROLE: Changed role from {old_role_name} to {new_role.name}",
            entity_type="user",
            entity_id=admin.id
        )

        self.db.commit()
        self.db.refresh(admin)

        return admin

    def update_admin_role_and_permissions(self, admin_id: int, data: "AdminRolePermissionUpdateRequest", changed_by_id: int) -> User:
        """
        Actualiza el rol base y los permisos directos de un administrador en una sola operación,
        y envía un correo de notificación.
        """
        admin = self.get_admin_by_id(admin_id)

        # 1. Update Role if it changed
        if admin.role_id != data.role_id:
            new_role = self.db.query(Role).filter(Role.id == data.role_id).first()
            if not new_role:
                raise NotFoundException("Rol", str(data.role_id))
            if new_role.name == "estudiante":
                raise InvalidCredentialsException("No se puede asignar rol de estudiante a un administrador")
            
            old_role_name = admin.role.name if admin.role else "None"
            admin.role_id = new_role.id

            self._create_audit_log(
                user_id=changed_by_id,
                action=f"CHANGE_ADMIN_ROLE: Changed role from {old_role_name} to {new_role.name}",
                entity_type="user",
                entity_id=admin.id
            )

        # 2. Update Direct Permissions
        # Remove existing direct permissions
        self.db.query(UserPermission).filter(UserPermission.user_id == admin.id).delete()
        
        # Add new direct permissions
        for perm_id in data.direct_permission_ids:
            # Check if permission exists
            perm = self.db.query(Permission).filter(Permission.id == perm_id).first()
            if not perm:
                raise NotFoundException("Permiso", str(perm_id))
                
            user_perm = UserPermission(
                user_id=admin.id,
                permission_id=perm_id,
                enabled=True
            )
            self.db.add(user_perm)

        self._create_audit_log(
            user_id=changed_by_id,
            action=f"UPDATE_DIRECT_PERMISSIONS: Set direct permissions for admin {admin.email}: {data.direct_permission_ids}",
            entity_type="user_permission",
            entity_id=admin.id
        )

        self.db.commit()
        self.db.refresh(admin)

        # 3. Send Email Notification
        from app.utils.email import send_admin_role_permission_update_email
        total_permissions = len(self.get_admin_permissions(admin_id)["permissions"])
        role_label = admin.role.name if admin.role else "Ninguno"
        
        send_admin_role_permission_update_email(
            to_email=admin.email,
            first_name=admin.first_name,
            new_role_name=role_label,
            total_permissions=total_permissions
        )

        return admin

    def update_admin_status(self, admin_id: int, data: AdminStatusUpdateRequest, updated_by_id: int) -> User:
        """
        Suspende o activa un administrador
        """
        admin = self.get_admin_by_id(admin_id)

        # No permitir suspenderse a sí mismo
        if admin.id == updated_by_id:
            raise InvalidCredentialsException("No puedes cambiar tu propio estado")

        old_status = admin.status
        admin.status = data.status

        # Registrar en audit log
        reason_text = f" Reason: {data.reason}" if data.reason else ""
        self._create_audit_log(
            user_id=updated_by_id,
            action=f"CHANGE_ADMIN_STATUS: Changed status from {old_status} to {data.status}.{reason_text}",
            entity_type="user",
            entity_id=admin.id
        )

        self.db.commit()
        self.db.refresh(admin)

        return admin

    def delete_admin(self, admin_id: int, deleted_by_id: int):
        """
        Elimina un administrador (soft delete - suspender)
        """
        admin = self.get_admin_by_id(admin_id)

        # No permitir eliminarse a sí mismo
        if admin.id == deleted_by_id:
            raise InvalidCredentialsException("No puedes eliminarte a ti mismo")

        # Soft delete - marcar como suspendido
        admin.status = UserStatus.SUSPENDED

        # Registrar en audit log
        self._create_audit_log(
            user_id=deleted_by_id,
            action=f"DELETE_ADMIN: Deleted admin {admin.email}",
            entity_type="user",
            entity_id=admin.id
        )

        self.db.commit()

    # ==========================
    # Gestión de Permisos
    # ==========================

    def get_admin_permissions(self, admin_id: int) -> Dict[str, Any]:
        """
        Obtiene todos los permisos de un administrador (rol + directos)
        """
        admin = self.get_admin_by_id(admin_id)

        role_permissions = []
        direct_permissions = []

        # Permisos del rol
        if admin.role:
            for rp in admin.role.role_permissions:
                role_permissions.append({
                    "id": rp.permission.id,
                    "code": rp.permission.code,
                    "description": rp.permission.description,
                    "granted_via": "role"
                })

        # Permisos directos
        for up in admin.user_permissions:
            if up.enabled:
                direct_permissions.append({
                    "id": up.permission.id,
                    "code": up.permission.code,
                    "description": up.permission.description,
                    "granted_via": "direct"
                })

        # Combinar, evitando duplicados
        all_permissions = role_permissions.copy()
        direct_codes = [p["code"] for p in direct_permissions]

        for dp in direct_permissions:
            if dp["code"] not in [p["code"] for p in role_permissions]:
                all_permissions.append(dp)

        return {
            "user_id": admin.id,
            "email": admin.email,
            "role": admin.role.name if admin.role else None,
            "permissions": all_permissions,
            "permission_count": len(all_permissions)
        }

    def add_permissions_to_admin(self, admin_id: int, data: AdminPermissionsUpdateRequest, updated_by_id: int) -> List[UserPermission]:
        """
        Agrega permisos directos a un administrador
        """
        admin = self.get_admin_by_id(admin_id)

        added_permissions = []

        for perm_id in data.permission_ids:
            # Verificar que el permiso existe
            permission = self.db.query(Permission).filter(Permission.id == perm_id).first()
            if not permission:
                raise NotFoundException("Permiso", str(perm_id))

            # Verificar si ya tiene el permiso
            existing = self.db.query(UserPermission).filter(
                UserPermission.user_id == admin.id,
                UserPermission.permission_id == perm_id
            ).first()

            if existing:
                if existing.enabled != data.enabled:
                    existing.enabled = data.enabled
                    added_permissions.append(existing)
            else:
                user_perm = UserPermission(
                    user_id=admin.id,
                    permission_id=perm_id,
                    enabled=data.enabled
                )
                self.db.add(user_perm)
                added_permissions.append(user_perm)

        # Registrar en audit log
        action = "ADD_PERMISSIONS" if data.enabled else "REMOVE_PERMISSIONS"
        self._create_audit_log(
            user_id=updated_by_id,
            action=f"{action}: Updated permissions for admin {admin.email}: {data.permission_ids}",
            entity_type="user_permission",
            entity_id=admin.id
        )

        self.db.commit()

        return added_permissions

    def remove_permission_from_admin(self, admin_id: int, permission_id: int, updated_by_id: int):
        """
        Elimina un permiso directo de un administrador
        """
        admin = self.get_admin_by_id(admin_id)

        # Buscar el permiso directo
        user_perm = self.db.query(UserPermission).filter(
            UserPermission.user_id == admin.id,
            UserPermission.permission_id == permission_id
        ).first()

        if not user_perm:
            raise NotFoundException("Permiso directo", f"user:{admin_id}, perm:{permission_id}")

        self.db.delete(user_perm)

        # Registrar en audit log
        self._create_audit_log(
            user_id=updated_by_id,
            action=f"REMOVE_PERMISSION: Removed permission {permission_id} from admin {admin.email}",
            entity_type="user_permission",
            entity_id=admin.id
        )

        self.db.commit()

    # ==========================
    # Gestión de Roles
    # ==========================

    def get_all_roles_with_permissions(self) -> List[Role]:
        """
        Obtiene todos los roles con sus permisos
        """
        return self.db.query(Role).options(
            joinedload(Role.role_permissions).joinedload(RolePermission.permission)
        ).all()

    def get_role_details(self, role_id: int) -> Role:
        """
        Obtiene detalles de un rol específico
        """
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise NotFoundException("Rol", str(role_id))

        return role

    def update_role_permissions(self, role_id: int, permission_ids: List[int], updated_by_id: int) -> Role:
        """
        Actualiza los permisos asignados a un rol
        """
        role = self.get_role_details(role_id)

        # No se pueden modificar los permisos del super_admin (opcional, pero buena práctica)
        if role.name in ["super_admin", "super_administrador"]:
            raise InsufficientPermissionsException("No se pueden modificar los permisos del super_admin directamente")

        # Eliminar permisos actuales
        self.db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()

        # Agregar nuevos permisos
        for perm_id in permission_ids:
            # Validar que el permiso existe
            permission = self.db.query(Permission).filter(Permission.id == perm_id).first()
            if not permission:
                raise NotFoundException("Permiso", str(perm_id))
                
            role_perm = RolePermission(
                role_id=role.id,
                permission_id=perm_id
            )
            self.db.add(role_perm)

        # Registrar en audit log
        self._create_audit_log(
            user_id=updated_by_id,
            action=f"UPDATE_ROLE_PERMISSIONS: Updated permissions for role {role.name}",
            entity_type="role",
            entity_id=role.id
        )

        self.db.commit()
        self.db.refresh(role)
        
        return role

    # ==========================
    # Métodos privados
    # ==========================

    def _create_audit_log(self, user_id: int, action: str, entity_type: str, entity_id: int):
        """
        Crea un registro de auditoría
        """
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=None
        )
        self.db.add(audit)