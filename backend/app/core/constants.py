from enum import Enum

# ==========================
# ENUMS
# ==========================

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"
    MAGIC_LINK = "magic_link"
    PASSWORD_RESET = "password_reset"

# ==========================
# PERMISOS (los definimos aquí por ahora)
# ==========================

PERMISSIONS = {
    # Gestión de Usuarios (SuperAdmin)
    "user:create:admin": "Crear administradores",
    "user:read:all": "Ver todos los usuarios",
    "user:update:role": "Cambiar rol de usuarios",
    "user:update:permissions": "Modificar permisos individuales",
    "user:suspend": "Suspender/activar usuarios",
    "user:delete": "Eliminar usuarios",
    
    # Préstamos (Admin Loans)
    "loan:create": "Crear préstamos",
    "loan:read:own": "Ver préstamos propios",
    "loan:read:all": "Ver todos los préstamos",
    "loan:update": "Actualizar préstamos",
    "loan:delete": "Eliminar préstamos",
    "loan:approve": "Aprobar préstamos",
    "loan:return": "Registrar devoluciones",
    "inventory:manage": "Gestionar inventario de implementos",
    "inventory:read": "Ver inventario",
    
    # Actividades (Admin Activities)
    "activity:manage": "Gestión total de actividades (crear, editar, eliminar)",
    "activity:create": "Crear actividades",
    "activity:read:own": "Ver actividades propias",
    "activity:read:all": "Ver todas las actividades",
    "activity:update": "Actualizar actividades",
    "activity:delete": "Eliminar actividades",
    "activity:assign_hours": "Asignar horas sociales",
    "activity:approve_hours": "Aprobar horas sociales",
    "activity:enroll": "Inscribir estudiantes",
    
    # Estudiantes
    "student:read:own": "Ver perfil propio",
    "student:update:own": "Actualizar perfil propio",
    "student:view_hours": "Ver horas sociales",
    
    # Sistema
    "system:audit_logs": "Ver logs de auditoría",
    "system:reports": "Generar reportes",
}

# ==========================
# ROLES CON SUS PERMISOS
# ==========================

ROLES = {
    "super_administrador": {
        "description": "Acceso total al sistema",
        "permissions": list(PERMISSIONS.keys())
    },
    "administrador_general": {
        "description": "Todos los permisos excepto gestión de admins",
        "permissions": [
            "user:read:all",
            "loan:create", "loan:read:all", "loan:update", "loan:delete", 
            "loan:approve", "loan:return", "inventory:manage", "inventory:read",
            "activity:manage", "activity:create", "activity:read:all", "activity:update", 
            "activity:delete", "activity:assign_hours", "activity:approve_hours",
            "activity:enroll", "system:audit_logs", "system:reports"
        ]
    },
    "administrador_prestamos": {
        "description": "Gestión completa de préstamos",
        "permissions": [
            "loan:create", "loan:read:all", "loan:update", "loan:delete",
            "loan:approve", "loan:return", "inventory:manage", "inventory:read"
        ]
    },
    "administrador_actividades": {
        "description": "Gestión completa de actividades",
        "permissions": [
            "activity:manage", "activity:create", "activity:read:all", "activity:update",
            "activity:delete", "activity:assign_hours", "activity:approve_hours",
            "activity:enroll"
        ]
    },
    "estudiante": {
        "description": "Usuario estudiante",
        "permissions": [
            "student:read:own", "student:update:own", "student:view_hours",
            "loan:read:own", "activity:read:own"
        ]
    }
}