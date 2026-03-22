// Roles del sistema
export const ROLES = {
  SUPER_ADMIN: 'super_administrador',
  ADMIN_FULL: 'administrador_general',
  ADMIN_LOANS: 'administrador_prestamos',
  ADMIN_ACTIVITIES: 'administrador_actividades',
  STUDENT: 'estudiante',
};

// Permisos del sistema (espejo de backend/constants.py)
export const PERMISSIONS = {
  // Gestión de Usuarios
  USER_CREATE_ADMIN: 'user:create:admin',
  USER_READ_ALL: 'user:read:all',
  USER_UPDATE_ROLE: 'user:update:role',
  USER_UPDATE_PERMISSIONS: 'user:update:permissions',
  USER_SUSPEND: 'user:suspend',
  USER_DELETE: 'user:delete',

  // Préstamos
  LOAN_CREATE: 'loan:create',
  LOAN_READ_OWN: 'loan:read:own',
  LOAN_READ_ALL: 'loan:read:all',
  LOAN_UPDATE: 'loan:update',
  LOAN_DELETE: 'loan:delete',
  LOAN_APPROVE: 'loan:approve',
  LOAN_RETURN: 'loan:return',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_READ: 'inventory:read',

  // Actividades
  ACTIVITY_MANAGE: 'activity:manage',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_READ_OWN: 'activity:read:own',
  ACTIVITY_READ_ALL: 'activity:read:all',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',
  ACTIVITY_ASSIGN_HOURS: 'activity:assign_hours',
  ACTIVITY_APPROVE_HOURS: 'activity:approve_hours',
  ACTIVITY_ENROLL: 'activity:enroll',

  // Estudiantes
  STUDENT_READ_OWN: 'student:read:own',
  STUDENT_UPDATE_OWN: 'student:update:own',
  STUDENT_VIEW_HOURS: 'student:view_hours',

  // Sistema
  SYSTEM_AUDIT_LOGS: 'system:audit_logs',
  SYSTEM_REPORTS: 'system:reports',
};

// Mapa de rol → permisos
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN_FULL]: [
    PERMISSIONS.USER_READ_ALL,
    PERMISSIONS.LOAN_CREATE, PERMISSIONS.LOAN_READ_ALL, PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.LOAN_DELETE, PERMISSIONS.LOAN_APPROVE, PERMISSIONS.LOAN_RETURN,
    PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.ACTIVITY_MANAGE,
    PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ_ALL, PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.ACTIVITY_DELETE, PERMISSIONS.ACTIVITY_ASSIGN_HOURS, PERMISSIONS.ACTIVITY_APPROVE_HOURS,
    PERMISSIONS.ACTIVITY_ENROLL,
    PERMISSIONS.SYSTEM_AUDIT_LOGS, PERMISSIONS.SYSTEM_REPORTS,
  ],
  [ROLES.ADMIN_LOANS]: [
    PERMISSIONS.LOAN_CREATE, PERMISSIONS.LOAN_READ_ALL, PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.LOAN_DELETE, PERMISSIONS.LOAN_APPROVE, PERMISSIONS.LOAN_RETURN,
    PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.INVENTORY_READ,
  ],
  [ROLES.ADMIN_ACTIVITIES]: [
    PERMISSIONS.ACTIVITY_MANAGE,
    PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ_ALL, PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.ACTIVITY_DELETE, PERMISSIONS.ACTIVITY_ASSIGN_HOURS, PERMISSIONS.ACTIVITY_APPROVE_HOURS,
    PERMISSIONS.ACTIVITY_ENROLL,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.STUDENT_READ_OWN, PERMISSIONS.STUDENT_UPDATE_OWN, PERMISSIONS.STUDENT_VIEW_HOURS,
    PERMISSIONS.LOAN_READ_OWN, PERMISSIONS.ACTIVITY_READ_OWN,
  ],
};

// Estados de usuario
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
};

// Labels para roles (UI)
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.ADMIN_FULL]: 'Administrador General',
  [ROLES.ADMIN_LOANS]: 'Admin Préstamos',
  [ROLES.ADMIN_ACTIVITIES]: 'Admin Actividades',
  [ROLES.STUDENT]: 'Estudiante',
};

// Labels para estados (UI)
export const STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Activo',
  [USER_STATUS.INACTIVE]: 'Inactivo',
  [USER_STATUS.SUSPENDED]: 'Suspendido',
};
