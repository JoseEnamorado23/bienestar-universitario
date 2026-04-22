import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineSave } from 'react-icons/hi';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RoleManagement() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Roles y Permisos',
        subtitle: 'Gestiona los roles del sistema y sus privilegios asignados de forma modular.'
      });
    }
  }, [setHeaderContent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setRoles(rolesRes.data);
      setAvailablePermissions(permsRes.data);
      
      if (rolesRes.data.length > 0) {
        handleSelectRole(rolesRes.data[0]);
      }
    } catch (err) {
      toast.error('Error al cargar roles y permisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    const initialPerms = new Set(role.permissions.map(p => p.id));
    setRolePermissions(initialPerms);
    setExpandedGroups(new Set());
  };

  const handleTogglePermission = (permissionId) => {
    if (selectedRole?.name === 'super_admin' || selectedRole?.name === 'super_administrador') {
      toast.error('No se pueden modificar los permisos del super_admin');
      return;
    }

    const newPerms = new Set(rolePermissions);
    if (newPerms.has(permissionId)) {
      newPerms.delete(permissionId);
    } else {
      newPerms.add(permissionId);
    }
    setRolePermissions(newPerms);
  };

  const handleToggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce((acc, perm) => {
      const group = perm.code.split(':')[0];
      if (!acc[group]) acc[group] = [];
      acc[group].push(perm);
      return acc;
    }, {});
  }, [availablePermissions]);

  const groupLabels = {
    'user': 'Gestión de Usuarios',
    'student': 'Gestión de Estudiantes',
    'activity': 'Actividades y Horas',
    'loan': 'Préstamos y Devoluciones',
    'inventory': 'Inventario y Equipos',
    'system': 'Sistema y Configuración',
    'role': 'Roles y Permisos'
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    setSaving(true);
    try {
      const permissionIds = Array.from(rolePermissions).filter(id => id !== undefined);
      const { data } = await api.put(`/admin/roles/${selectedRole.id}/permissions`, {
        permission_ids: permissionIds
      });
      
      setRoles(roles.map(r => r.id === data.id ? data : r));
      setSelectedRole(data);
      
      toast.success('Permisos actualizados correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
      </div>
    );
  }

  const getFriendlyRoleName = (name) => {
    const names = {
      'super_administrador': 'Super Administrador',
      'super_admin': 'Super Administrador',
      'administrador_general': 'Administrador General',
      'administrador_prestamos': 'Gestión Préstamos',
      'administrador_actividades': 'Gestión Actividades'
    };
    return names[name] || name;
  };

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h1>Roles y Permisos</h1>
            <p>Gestiona los roles del sistema y sus privilegios asignados</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Seleccionar Rol:</span>
            <select 
              className="form-input" 
              value={selectedRole?.id || ''} 
              onChange={(e) => {
                const role = roles.find(r => r.id === Number(e.target.value));
                if (role) handleSelectRole(role);
              }}
              style={{ width: '280px', margin: 0, padding: '4px 8px', height: '36px', fontSize: '0.9rem' }}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {getFriendlyRoleName(role.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {(selectedRole?.name === 'super_administrador' || selectedRole?.name === 'super_admin') && (
            <div style={{ 
              background: 'rgba(0, 172, 201, 0.05)', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              marginBottom: '2rem', 
              border: '1px solid rgba(0, 172, 201, 0.2)', 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'center' 
            }}>
              <HiOutlineShieldCheck style={{ color: 'var(--primary-color)' }} size={24} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Control Maestro Activo:</strong> El rol <code>{selectedRole.name}</code> posee privilegios globales permanentes que no pueden ser modificados.
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Privilegios del Rol
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.keys(groupedPermissions).map(group => {
              const permsInGroup = groupedPermissions[group];
              const activeInGroupCount = permsInGroup.filter(p => rolePermissions.has(p.id)).length;
              const isExpanded = expandedGroups.has(group);

              return (
                <div key={group} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  <div 
                    onClick={() => handleToggleGroup(group)}
                    style={{ 
                      padding: '1.25rem', 
                      background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '1.5rem', display: 'flex', color: 'var(--text-muted)' }}>
                         {isExpanded ? <BiChevronDown /> : <BiChevronRight />}
                       </span>
                       <span style={{ fontWeight: 600, color: isExpanded ? 'var(--primary-color)' : 'inherit' }}>
                         {groupLabels[group] || group.toUpperCase()}
                       </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-glass)', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {activeInGroupCount} / {permsInGroup.length}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}>
                      {permsInGroup.map(perm => {
                        const isActive = rolePermissions.has(perm.id);
                        const isSuperAdmin = selectedRole?.name === 'super_administrador' || selectedRole?.name === 'super_admin';

                        return (
                          <label 
                            key={perm.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              padding: '1rem',
                              background: isActive ? 'rgba(0, 172, 201, 0.04)' : 'transparent',
                              border: `1px solid ${isActive ? 'rgba(0, 172, 201, 0.25)' : 'var(--border-color)'}`,
                              borderRadius: '12px',
                              cursor: isSuperAdmin ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: isSuperAdmin ? 0.8 : 1
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isActive}
                              onChange={() => handleTogglePermission(perm.id)}
                              disabled={isSuperAdmin}
                              className="form-checkbox"
                              style={{ marginTop: '0.2rem' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: isActive ? 'var(--primary-color)' : 'inherit', fontFamily: 'monospace' }}>
                                {perm.code}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {perm.description || 'Sin descripción'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSavePermissions}
              disabled={saving || selectedRole?.name === 'super_administrador' || selectedRole?.name === 'super_admin'}
              style={{ padding: '0 40px', height: '48px', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 172, 201, 0.3)' }}
            >
              {saving ? 'Guardando...' : (
                <>
                  <HiOutlineSave size={20} style={{ marginRight: '8px' }} />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
