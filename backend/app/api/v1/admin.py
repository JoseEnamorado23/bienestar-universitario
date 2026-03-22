from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.constants import UserStatus
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.permissions import require_super_admin, require_permissions, require_any_permissions
from app.models.user import User
from app.models.settings import SystemSetting
from app.schemas.admin import (
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminChangeRoleRequest,
    AdminRolePermissionUpdateRequest,
    AdminPermissionsUpdateRequest,
    AdminStatusUpdateRequest,
    AdminResponse,
    AdminListResponse,
    AdminPermissionResponse,
    RolePermissionDetailResponse  # Ahora sí existe
)
from app.schemas.roles import PermissionResponse, RolePermissionAssignment
from app.schemas.auth import MessageResponse
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Administración"])

# ==========================
# Gestión de Administradores
# ==========================

@router.get("/users")
async def list_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    role_id: Optional[int] = Query(None),
    status: Optional[UserStatus] = Query(None),
    sort_by: str = Query("id"),
    order: str = Query("desc"),
    current_user: User = Depends(require_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """
    Lista todos los administradores con filtros, ordenamiento y paginación
    """
    service = AdminService(db)
    admins_data = service.get_admins(
        skip=skip,
        limit=limit,
        search=search,
        role_id=role_id,
        status=status,
        sort_by=sort_by,
        order=order
    )
    
    admins = admins_data["items"]
    
    result = []
    for admin in admins:
        result.append({
            "id": admin.id,
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "national_id": admin.national_id,
            "role_id": admin.role_id,
            "role_name": admin.role.name if admin.role else "Sin rol",
            "status": admin.status,
            "is_verified": admin.is_verified,
            "created_at": admin.created_at
        })
    
    return {
        "items": result,
        "total": admins_data["total"],
        "skip": skip,
        "limit": limit
    }

@router.get("/students")
async def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = Query(None),
    status: Optional[UserStatus] = Query(None),
    sort_by: str = Query("id"),
    order: str = Query("desc"),
    current_user: User = Depends(require_any_permissions(["user:read:all", "loan:create"])),
    db: Session = Depends(get_db)
):
    """
    Lista todos los estudiantes con filtros, ordenamiento y paginación
    """
    service = AdminService(db)
    students_data = service.get_students(
        skip=skip, 
        limit=limit, 
        search=search, 
        program_id=program_id, 
        status=status, 
        sort_by=sort_by, 
        order=order
    )
    
    students = students_data["items"]
    
    # Get required hours setting once
    setting = db.query(SystemSetting).filter(SystemSetting.key == "HORAS_SOCIALES_REQUERIDAS").first()
    required_hours = 120
    if setting and setting.value.isdigit():
        required_hours = int(setting.value)
    
    result = []
    for user in students:
        student_data = user.student
        result.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "status": user.status,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "national_id": student_data.national_id if student_data else None,
            "phone": user.phone,
            "program_name": student_data.program.name if student_data and student_data.program else "Sin programa",
            "social_hours_completed": student_data.social_hours_completed if student_data else 0,
            "social_hours_required": required_hours,
            "block_reason": user.block_reason,
        })
    
    return {
        "items": result,
        "total": students_data["total"],
        "skip": skip,
        "limit": limit
    }

@router.get("/users/{user_id}", response_model=AdminResponse)
async def get_admin(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """
    Obtiene detalles de un administrador específico (solo super_admin)
    """
    service = AdminService(db)
    admin = service.get_admin_by_id(user_id)
    
    # Obtener permisos
    permissions_data = service.get_admin_permissions(user_id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "phone": admin.phone,
        "national_id": admin.national_id,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "is_verified": admin.is_verified,
        "permissions": permissions_data["permissions"],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.post("/users", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    data: AdminCreateRequest,
    current_user: User = Depends(require_permissions(["user:create:admin"])),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo administrador (solo super_admin)
    """
    service = AdminService(db)
    admin = service.create_admin(data, current_user.id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "phone": data.phone,
        "national_id": admin.national_id,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "is_verified": admin.is_verified,  # Agregado
        "permissions": [],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.patch("/users/{user_id}", response_model=AdminResponse)
async def update_admin(
    data: AdminUpdateRequest,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:create:admin"])),
    db: Session = Depends(get_db)
):
    """
    Actualiza datos de un administrador (solo super_admin)
    """
    service = AdminService(db)
    admin = service.update_admin(user_id, data, current_user.id)
    
    # Obtener permisos (esto ya no debería dar error porque eliminamos created_at)
    permissions_data = service.get_admin_permissions(user_id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "phone": admin.phone,
        "national_id": admin.national_id,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "is_verified": admin.is_verified,
        "permissions": permissions_data["permissions"],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.patch("/users/{user_id}/role", response_model=AdminResponse)
async def change_admin_role(
    data: AdminChangeRoleRequest,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:update:role"])),
    db: Session = Depends(get_db)
):
    """
    Cambia el rol de un administrador (solo super_admin)
    """
    service = AdminService(db)
    admin = service.change_admin_role(user_id, data, current_user.id)
    
    permissions_data = service.get_admin_permissions(user_id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "phone": admin.phone,
        "national_id": admin.national_id,
        "is_verified": admin.is_verified,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "permissions": permissions_data["permissions"],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.put("/users/{user_id}/role-and-permissions", response_model=AdminResponse)
async def update_admin_role_and_permissions(
    data: AdminRolePermissionUpdateRequest,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:update:role", "user:update:permissions"])),
    db: Session = Depends(get_db)
):
    """
    Actualiza el rol base y los permisos directos de un administrador en una sola operación
    """
    service = AdminService(db)
    admin = service.update_admin_role_and_permissions(user_id, data, current_user.id)
    
    permissions_data = service.get_admin_permissions(user_id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "phone": admin.phone,
        "national_id": admin.national_id,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "is_verified": admin.is_verified,
        "permissions": permissions_data["permissions"],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.patch("/users/{user_id}/status", response_model=AdminResponse)
async def update_admin_status(
    data: AdminStatusUpdateRequest,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:suspend"])),
    db: Session = Depends(get_db)
):
    """
    Suspende o activa un administrador (solo super_admin)
    """
    service = AdminService(db)
    admin = service.update_admin_status(user_id, data, current_user.id)
    
    permissions_data = service.get_admin_permissions(user_id)
    
    return {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "phone": admin.phone,
        "national_id": admin.national_id,
        "role_id": admin.role_id,
        "role_name": admin.role.name if admin.role else "Sin rol",
        "status": admin.status,
        "is_verified": admin.is_verified,
        "permissions": permissions_data["permissions"],
        "created_at": admin.created_at,
        "updated_at": admin.updated_at
    }

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_admin(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:delete"])),
    db: Session = Depends(get_db)
):
    """
    Elimina (suspende) un administrador (solo super_admin)
    """
    service = AdminService(db)
    service.delete_admin(user_id, current_user.id)
    
    return MessageResponse(
        message="Administrador suspendido exitosamente"
    )

# ==========================
# Gestión de Permisos
# ==========================

@router.get("/users/{user_id}/permissions", response_model=List[AdminPermissionResponse])
async def get_admin_permissions(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los permisos de un administrador (solo super_admin)
    """
    service = AdminService(db)
    permissions_data = service.get_admin_permissions(user_id)
    
    return permissions_data["permissions"]

@router.post("/users/{user_id}/permissions", response_model=MessageResponse)
async def add_permissions_to_admin(
    data: AdminPermissionsUpdateRequest,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:update:permissions"])),
    db: Session = Depends(get_db)
):
    """
    Agrega permisos directos a un administrador (solo super_admin)
    """
    service = AdminService(db)
    service.add_permissions_to_admin(user_id, data, current_user.id)
    
    action = "agregados" if data.enabled else "removidos"
    return MessageResponse(
        message=f"Permisos {action} exitosamente"
    )

@router.delete("/users/{user_id}/permissions/{permission_id}", response_model=MessageResponse)
async def remove_permission_from_admin(
    user_id: int = Path(..., ge=1),
    permission_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:update:permissions"])),
    db: Session = Depends(get_db)
):
    """
    Elimina un permiso directo de un administrador (solo super_admin)
    """
    service = AdminService(db)
    service.remove_permission_from_admin(user_id, permission_id, current_user.id)
    
    return MessageResponse(
        message="Permiso removido exitosamente"
    )

# ==========================
# Gestión de Roles
# ==========================

@router.get("/roles", response_model=List[RolePermissionDetailResponse])
async def list_roles(
    current_user: User = Depends(require_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """
    Lista todos los roles con sus permisos (solo super_admin)
    """
    service = AdminService(db)
    roles = service.get_all_roles_with_permissions()
    
    result = []
    for role in roles:
        # Contar usuarios con este rol
        user_count = db.query(User).filter(User.role_id == role.id).count()
        
        # Obtener permisos
        permissions = []
        for rp in role.role_permissions:
            permissions.append({
                "id": rp.permission.id,
                "code": rp.permission.code,
                "description": rp.permission.description
            })
        
        result.append({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "is_system_role": role.is_system_role,
            "permissions": permissions,
            "user_count": user_count
        })
    
    return result

@router.get("/roles/{role_id}", response_model=RolePermissionDetailResponse)
async def get_role_details(
    role_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:create:admin"])),
    db: Session = Depends(get_db)
):
    """
    Obtiene detalles de un rol específico (solo super_admin)
    """
    service = AdminService(db)
    role = service.get_role_details(role_id)
    
    # Contar usuarios con este rol
    user_count = db.query(User).filter(User.role_id == role.id).count()
    
    # Obtener permisos
    permissions = []
    for rp in role.role_permissions:
        permissions.append({
            "id": rp.permission.id,
            "code": rp.permission.code,
            "description": rp.permission.description
        })
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system_role": role.is_system_role,
        "permissions": permissions,
        "user_count": user_count
    }

@router.put("/roles/{role_id}/permissions", response_model=RolePermissionDetailResponse)
async def update_role_permissions(
    data: RolePermissionAssignment,
    role_id: int = Path(..., ge=1),
    current_user: User = Depends(require_permissions(["user:create:admin"])),
    db: Session = Depends(get_db)
):
    """
    Actualiza los permisos asignados a un rol (solo super_admin)
    """
    service = AdminService(db)
    
    # Check if role exists first (service does this too, but we want to fail fast if possible)
    role = service.update_role_permissions(role_id, data.permission_ids, current_user.id)
    
    # Contar usuarios con este rol
    user_count = db.query(User).filter(User.role_id == role.id).count()
    
    # Obtener permisos actualizados
    permissions = []
    for rp in role.role_permissions:
        permissions.append({
            "id": rp.permission.id,
            "code": rp.permission.code,
            "description": rp.permission.description
        })
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system_role": role.is_system_role,
        "permissions": permissions,
        "user_count": user_count
    }

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    current_user: User = Depends(require_permissions(["user:create:admin"])),
    db: Session = Depends(get_db)
):
    """
    Lista todos los permisos del sistema (solo super_admin)
    """
    from app.models.permission import Permission
    
    permissions = db.query(Permission).all()
    return permissions


# ──────────────────────────────────────────────────
# Estudiantes: Acciones adicionales
# ──────────────────────────────────────────────────

from app.models.student import Student
from app.models.loan import Loan
from app.models.additional_hours import AdditionalHours
from pydantic import BaseModel
from datetime import date as DateType

class StudentStatusUpdate(BaseModel):
    status: str  # "ACTIVE" | "INACTIVE"
    block_reason: Optional[str] = None

class StudentInfoUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    national_id: Optional[str] = None
    program_id: Optional[int] = None

class AdditionalHoursCreate(BaseModel):
    hours: float
    reason: str
    date_granted: DateType


@router.patch("/students/{user_id}/status")
async def toggle_student_status(
    user_id: int = Path(..., ge=1),
    body: StudentStatusUpdate = ...,
    current_user: User = Depends(require_any_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """Bloquea o desbloquea un estudiante cambiando su status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    allowed = ["ACTIVE", "INACTIVE"]
    if body.status not in allowed:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Estado inválido. Usa: {allowed}")
    user.status = body.status
    if body.status == "INACTIVE":
        user.block_reason = body.block_reason or None
    else:
        # Al desbloquear, limpiar motivo
        user.block_reason = None
    db.commit()
    return {"message": f"Estado actualizado a {body.status}", "user_id": user_id}


@router.patch("/students/{user_id}/info")
async def update_student_info(
    user_id: int = Path(..., ge=1),
    body: StudentInfoUpdate = ...,
    current_user: User = Depends(require_any_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """Edita la información básica de un estudiante."""
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if student:
        if body.national_id is not None:
            student.national_id = body.national_id
        if body.program_id is not None:
            student.program_id = body.program_id
    db.commit()
    return {"message": "Información actualizada correctamente"}


@router.get("/students/{user_id}/loans")
async def get_student_loan_history(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_any_permissions(["user:read:all", "loan:read:all"])),
    db: Session = Depends(get_db)
):
    """Historial de préstamos de un estudiante específico."""
    from fastapi import HTTPException
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado")
    loans = db.query(Loan).filter(Loan.student_id == student.id).order_by(Loan.created_at.desc()).all()
    result = []
    for loan in loans:
        result.append({
            "id": loan.id,
            "item_name": loan.item.name if loan.item else "—",
            "status": loan.status,
            "start_time": loan.start_time.isoformat() if loan.start_time else None,
            "returned_time": loan.returned_time.isoformat() if loan.returned_time else None,
            "hours_earned": loan.hours_earned,
            "rejection_reason": loan.rejection_reason,
        })
    return result


@router.get("/students/{user_id}/activities")
async def get_student_activity_history(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_any_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """Historial de actividades de un estudiante específico."""
    from fastapi import HTTPException
    from app.models.activity_attendance import ActivityAttendance
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado")
    
    records = db.query(ActivityAttendance).filter(
        ActivityAttendance.student_id == student.id
    ).order_by(ActivityAttendance.scanned_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "activity_name": r.activity.title if r.activity else "—",
            "hours_earned": r.hours_earned,
            "scanned_at": r.scanned_at.isoformat() if r.scanned_at else None,
        }
        for r in records
    ]


@router.get("/students/{user_id}")
async def get_student_detail(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_any_permissions(["user:read:all", "loan:read:own"])),
    db: Session = Depends(get_db)
):
    """Obtener detalles de un estudiante por su ID de usuario."""
    from fastapi import HTTPException
    from app.models.student import Student
    from app.models.settings import SystemSetting
    
    # Permission check: students can only see their own details
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este perfil")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    student_data = db.query(Student).filter(Student.user_id == user_id).first()
    if not student_data:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado")
        
    # Get required hours setting
    setting = db.query(SystemSetting).filter(SystemSetting.key == "HORAS_SOCIALES_REQUERIDAS").first()
    required_hours = 120
    if setting and setting.value.isdigit():
        required_hours = int(setting.value)
        
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "status": user.status,
        "national_id": student_data.national_id,
        "phone": user.phone,
        "program_name": student_data.program.name if student_data.program else "Sin programa",
        "social_hours_completed": student_data.social_hours_completed,
        "social_hours_required": required_hours
    }


@router.post("/students/{user_id}/additional-hours")
async def add_additional_hours(
    user_id: int = Path(..., ge=1),
    body: AdditionalHoursCreate = ...,
    current_user: User = Depends(require_any_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """Añade horas adicionales manualmente a un estudiante."""
    from fastapi import HTTPException
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado")
    additional = AdditionalHours(
        student_id=student.id,
        hours=body.hours,
        reason=body.reason,
        date_granted=body.date_granted,
        granted_by_id=current_user.id
    )
    db.add(additional)
    # Also update the cumulative social hours on the student
    student.social_hours_completed = (student.social_hours_completed or 0) + body.hours
    db.commit()
    return {"message": f"{body.hours}h añadidas correctamente", "new_total": student.social_hours_completed}


@router.get("/students/{user_id}/additional-hours")
async def get_additional_hours(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(require_any_permissions(["user:read:all"])),
    db: Session = Depends(get_db)
):
    """Historial de horas adicionales otorgadas a un estudiante."""
    from fastapi import HTTPException
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado")
    records = db.query(AdditionalHours).filter(
        AdditionalHours.student_id == student.id
    ).order_by(AdditionalHours.date_granted.desc()).all()
    return [
        {
            "id": r.id,
            "hours": r.hours,
            "reason": r.reason,
            "date_granted": r.date_granted.isoformat(),
            "granted_by": f"{r.granted_by.first_name} {r.granted_by.last_name}" if r.granted_by else "—",
        }
        for r in records
    ]