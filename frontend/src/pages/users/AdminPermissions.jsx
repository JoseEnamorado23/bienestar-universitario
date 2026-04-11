import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import api from '../../api/axios';

export default function AdminPermissions() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { setHeaderContent } = useOutletContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  
  // Data from backend
  const [systemRoles, setSystemRoles] = useState([]);
  const [systemPermissions, setSystemPermissions] = useState([]);
  
  // State for the form
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // UI State for groups
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Gestión de Permisos',
        subtitle: 'Configura el nivel de acceso y permisos específicos para el administrador.'
      });
    }
  }, [setHeaderContent]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes, adminRes, adminPermsRes] = await Promise.all([
          api.get('/admin/roles'),
          api.get('/admin/permissions'),
          api.get(`/admin/users/${userId}`),
          api.get(`/admin/users/${userId}/permissions`)
        ]);
        
        setSystemRoles(rolesRes.data);
        setSystemPermissions(permsRes.data);
        setAdmin(adminRes.data);
        
        // Initialize form state
        setSelectedRoleId(adminRes.data.role_id || '');
        
        // Find which permissions are DIRECT
        const directPerms = adminPermsRes.data
          .filter(p => p.granted_via === 'direct' || p.granted_via === 'both')
          .map(p => p.id);
        
        setSelectedPermissions(directPerms);
        
        // All groups closed by default as requested
        setExpandedGroups(new Set());
        
      } catch (error) {
        toast.error('Error al cargar datos del administrador');
        navigate('/dashboard/usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, navigate]);

  // Derived state: permissions of the selected role
  const currentRolePermissionsIds = useMemo(() => {
    if (!selectedRoleId || !systemRoles.length) return [];
    const role = systemRoles.find(r => r.id === Number(selectedRoleId));
    if (!role) return [];
    return role.permissions.map(p => p.id);
  }, [selectedRoleId, systemRoles]);

  // Group permissions by prefix
  const groupedPermissions = useMemo(() => {
    if (!systemPermissions.length) return {};
    return systemPermissions.reduce((acc, perm) => {
      const group = perm.code.split(':')[0];
      if (!acc[group]) acc[group] = [];
      acc[group].push(perm);
      return acc;
    }, {});
  }, [systemPermissions]);

  const groupLabels = {
    'user': 'Gestión de Usuarios',
    'student': 'Gestión de Estudiantes',
    'activity': 'Actividades y Horas',
    'loan': 'Préstamos y Devoluciones',
    'inventory': 'Inventario y Equipos',
    'system': 'Sistema y Configuración',
    'role': 'Roles y Permisos',
    'report': 'Reportes'
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

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}/role-and-permissions`, {
        role_id: Number(selectedRoleId),
        direct_permission_ids: selectedPermissions
      });
      
      toast.success('Cambios guardados correctamente');
      navigate('/dashboard/usuarios');
    } catch (error) {
      toast.error('Error al guardar los cambios');
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

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/dashboard/usuarios')} 
              className="btn btn-ghost" 
              style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px' }}
            >
              <HiOutlineArrowLeft size={20} />
            </button>
            <div>
              <h3 style={{ margin: 0 }}>Gestión de Accesos</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Personalizando para: <strong>{admin?.first_name} {admin?.last_name}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rol Base:</span>
            <select 
              className="form-input" 
              value={selectedRoleId} 
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{ width: '280px', margin: 0, padding: '4px 8px', height: '36px', fontSize: '0.9rem' }}
            >
              {systemRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.description || role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Permisos Directos <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(Asignación individual)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.keys(groupedPermissions).map(group => {
              const permsInGroup = groupedPermissions[group];
              const activeInGroupCount = permsInGroup.filter(p => 
                currentRolePermissionsIds.includes(p.id) || selectedPermissions.includes(p.id)
              ).length;
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
                        const isFromRole = currentRolePermissionsIds.includes(perm.id);
                        const isDirectlyAssigned = selectedPermissions.includes(perm.id);
                        const isActive = isFromRole || isDirectlyAssigned;

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
                              cursor: isFromRole ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: isFromRole ? 0.8 : 1
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isActive}
                              onChange={() => handleTogglePermission(perm.id)}
                              disabled={isFromRole}
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
                              {isFromRole && (
                                <span style={{ 
                                  display: 'inline-block', 
                                  marginTop: '6px', 
                                  fontSize: '0.65rem', 
                                  fontWeight: 700, 
                                  textTransform: 'uppercase', 
                                  color: 'var(--primary-color)',
                                  background: 'rgba(0, 172, 201, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Heredado del Rol
                                </span>
                              )}
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
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '0 40px', height: '48px', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 172, 201, 0.3)' }}
            >
              {saving ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
