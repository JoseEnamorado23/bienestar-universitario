import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from './constants';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(userPermissions, permissionCode) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(permissionCode);
}

/**
 * Verifica si un usuario tiene alguno de los permisos dados
 */
export function hasAnyPermission(userPermissions, permissionCodes) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return permissionCodes.some((code) => userPermissions.includes(code));
}

/**
 * Verifica si es un rol de administrador
 */
export function isAdmin(role) {
  return role !== ROLES.STUDENT;
}

/**
 * Retorna los items del sidebar según los permisos del usuario
 */
export function getMenuItems(userPermissions) {
  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: HiOutlineHome,
      show: true,
    },
  ];

  // Gestión de usuarios — solo super_admin y admin_full
  if (hasPermission(userPermissions, PERMISSIONS.USER_READ_ALL)) {
    items.push({
      id: 'admins',
      label: 'Administradores',
      path: '/dashboard/usuarios',
      icon: HiOutlineUsers,
      show: true,
    });
    
    // Nueva ruta para Estudiantes
    items.push({
      id: 'students',
      label: 'Estudiantes',
      path: '/dashboard/estudiantes',
      icon: HiOutlineAcademicCap,
      show: true,
    });
  }

  // Roles y permisos — solo super_admin
  if (hasPermission(userPermissions, PERMISSIONS.USER_CREATE_ADMIN)) {
    items.push({
      id: 'roles',
      label: 'Roles y Permisos',
      path: '/dashboard/roles',
      icon: HiOutlineShieldCheck,
      show: true,
    });
  }

  // Módulo de Préstamos e Inventario
  if (hasAnyPermission(userPermissions, [PERMISSIONS.LOAN_READ_ALL, PERMISSIONS.LOAN_READ_OWN, PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_MANAGE])) {
    const loanChildren = [];

    if (hasAnyPermission(userPermissions, [PERMISSIONS.LOAN_READ_ALL, PERMISSIONS.LOAN_READ_OWN])) {
      if (hasPermission(userPermissions, PERMISSIONS.LOAN_READ_ALL)) {
        loanChildren.push({
          id: 'loans-new',
          label: 'Nuevo Préstamo',
          path: 'modal:new-loan'
        });
        loanChildren.push({
          id: 'loans-list',
          label: 'Lista de Préstamos',
          path: '/dashboard/prestamos'
        });
        loanChildren.push({
          id: 'loans-board',
          label: 'Tablero Kanban',
          path: '/dashboard/prestamos/tablero'
        });
      }

      if (hasPermission(userPermissions, PERMISSIONS.LOAN_READ_OWN) && !hasPermission(userPermissions, PERMISSIONS.LOAN_READ_ALL)) {
        loanChildren.push({
          id: 'student-loans',
          label: 'Mis Préstamos',
          path: '/dashboard/mis-prestamos',
          icon: HiOutlineClipboardList
        });
      }
    }

    if (hasAnyPermission(userPermissions, [PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.INVENTORY_READ])) {
      loanChildren.push({
        id: 'inventory',
        label: 'Inventario',
        path: '/dashboard/inventario'
      });
    }

    if (loanChildren.length > 0) {
      const isStudentOnly = hasPermission(userPermissions, PERMISSIONS.LOAN_READ_OWN) && !hasPermission(userPermissions, PERMISSIONS.LOAN_READ_ALL);
      
      items.push({
        id: 'loans-module',
        label: 'Préstamos',
        icon: HiOutlineClipboardList,
        path: isStudentOnly ? '/dashboard/horas' : undefined,
        show: true,
        children: isStudentOnly ? undefined : loanChildren
      });
    }

    // Direct top-level item for students (Pedir Implemento)
    if (hasPermission(userPermissions, PERMISSIONS.LOAN_READ_OWN) && !hasPermission(userPermissions, PERMISSIONS.LOAN_READ_ALL)) {
      items.push({
        id: 'student-inventory-direct',
        label: 'Pedir Implemento',
        path: '/dashboard/implementos',
        icon: HiOutlineCube,
        show: true,
      });
    }
  }

  // Actividades — Admin
  if (hasPermission(userPermissions, PERMISSIONS.ACTIVITY_MANAGE) ||
      hasAnyPermission(userPermissions, [PERMISSIONS.ACTIVITY_READ_ALL])) {
    items.push({
      id: 'activities',
      label: 'Actividades',
      path: '/dashboard/actividades',
      icon: HiOutlineCalendar,
      show: true,
    });
  }

  // Mis Actividades — Estudiante
  if (hasPermission(userPermissions, PERMISSIONS.LOAN_READ_OWN) &&
      !hasPermission(userPermissions, PERMISSIONS.ACTIVITY_MANAGE) &&
      !hasPermission(userPermissions, PERMISSIONS.ACTIVITY_READ_ALL)) {
    items.push({
      id: 'my-activities',
      label: 'Mis Actividades',
      path: '/dashboard/mis-actividades',
      icon: HiOutlineCalendar,
      show: true,
    });
  }

  // Horas sociales (Removing redundant item as it's now part of the main "Horas" link for students/admins)
  // if (hasAnyPermission(userPermissions, [PERMISSIONS.ACTIVITY_ASSIGN_HOURS, PERMISSIONS.STUDENT_VIEW_HOURS])) {
  //   items.push({
  //     id: 'hours',
  //     label: 'Horas Sociales',
  //     path: '/dashboard/horas',
  //     icon: HiOutlineClock,
  //     show: true,
  //   });
  // }

  // (Centralized Reports module removed in favor of contextual reports)

  // Auditoría
  if (hasPermission(userPermissions, PERMISSIONS.SYSTEM_AUDIT_LOGS)) {
    items.push({
      id: 'audit',
      label: 'Auditoría',
      path: '/dashboard/auditoria',
      icon: HiOutlineCog,
      show: true,
    });
  }

  // Mi perfil — Todos los usuarios
  items.push({
    id: 'profile',
    label: 'Mi Perfil',
    path: '/dashboard/perfil',
    icon: HiOutlineAcademicCap,
    show: true,
  });

  return items.filter((i) => i.show);
}

/**
 * Retorna la configuración de widgets del dashboard según el rol
 */
export function getDashboardConfig(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return {
        title: 'Panel de Super Administrador',
        subtitle: 'Control total del sistema',
        showSystemStats: true,
        showUserManagement: true,
        showAllModules: true,
        quickActions: [
          { label: 'Crear Admin', path: '/dashboard/usuarios', icon: HiOutlineUsers, color: '#00acc9' },
          { label: 'Ver Roles', path: '/dashboard/roles', icon: HiOutlineShieldCheck, color: '#80ba27' },
          { label: 'Auditoría', path: '/dashboard/auditoria', icon: HiOutlineCog, color: '#4facfe' },
        ],
      };
    case ROLES.ADMIN_FULL:
      return {
        title: 'Panel de Administración',
        subtitle: 'Gestión completa del sistema',
        showSystemStats: true,
        showUserManagement: false,
        showAllModules: true,
        quickActions: [
          { label: 'Préstamos', path: '/dashboard/prestamos', icon: HiOutlineClipboardList, color: '#00acc9' },
          { label: 'Actividades', path: '/dashboard/actividades', icon: HiOutlineCalendar, color: '#80ba27' },
          { label: 'Inventario', path: '/dashboard/inventario', icon: HiOutlineCube, color: '#f093fb' },
        ],
      };
    case ROLES.ADMIN_LOANS:
      return {
        title: 'Panel de Préstamos',
        subtitle: 'Gestión de préstamos e inventario',
        showSystemStats: false,
        showUserManagement: false,
        showAllModules: false,
        quickActions: [
          { label: 'Nuevo Préstamo', path: 'modal:new-loan', icon: HiOutlineClipboardList, color: '#00acc9' },
          { label: 'Inventario', path: '/dashboard/inventario', icon: HiOutlineCube, color: '#80ba27' },
          { label: 'Devoluciones', path: '/dashboard/prestamos', icon: HiOutlineClipboardList, color: '#4facfe' },
        ],
      };
    case ROLES.ADMIN_ACTIVITIES:
      return {
        title: 'Panel de Actividades',
        subtitle: 'Gestión de actividades y horas sociales',
        showSystemStats: false,
        showUserManagement: false,
        showAllModules: false,
        quickActions: [
          { label: 'Nueva Actividad', path: '/dashboard/actividades', icon: HiOutlineCalendar, color: '#00acc9' },
          { label: 'Horas Sociales', path: '/dashboard/horas', icon: HiOutlineClock, color: '#80ba27' },
          { label: 'Inscripciones', path: '/dashboard/actividades', icon: HiOutlineCalendar, color: '#f093fb' },
        ],
      };
    case ROLES.STUDENT:
      return {
        title: 'Mi Portal Estudiantil',
        subtitle: 'Bienvenido a Bienestar Universitario',
        showSystemStats: false,
        showUserManagement: false,
        showAllModules: false,
        quickActions: [
          { label: 'Pedir Implemento', path: '/dashboard/implementos', icon: HiOutlineCube, color: '#f093fb' },
          { label: 'Mis Horas', path: '/dashboard/horas', icon: HiOutlineClock, color: '#00acc9' },
          { label: 'Mis Préstamos', path: '/dashboard/prestamos', icon: HiOutlineClipboardList, color: '#80ba27' },
          { label: 'Actividades', path: '/dashboard/actividades', icon: HiOutlineCalendar, color: '#4facfe' },
        ],
      };
    default:
      return {
        title: 'Dashboard',
        subtitle: '',
        showSystemStats: false,
        showUserManagement: false,
        showAllModules: false,
        quickActions: [],
      };
  }
}
