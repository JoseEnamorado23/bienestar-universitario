import { useState, useEffect } from 'react';
import { HiOutlineUserAdd, HiOutlineArrowLeft } from 'react-icons/hi';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CreateAdmin() {
  const navigate = useNavigate();
  const { setHeaderContent } = useOutletContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    national_id: '',
    phone: '',
    role_id: ''
  });

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Nuevo Administrador',
        subtitle: 'Ingrese los datos del nuevo administrador'
      });
    }
  }, [setHeaderContent]);
  
  const [roles, setRoles] = useState([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const { data } = await api.get('/admin/roles');
      setRoles(data);
    } catch (err) {
      toast.error('Error al cargar roles');
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    setFormData({ ...formData, role_id: roleId });

    if (roleId) {
      const role = roles.find(r => r.id === parseInt(roleId));
      if (role && role.permissions) {
        setSelectedRolePermissions(role.permissions);
      } else {
        setSelectedRolePermissions([]);
      }
    } else {
      setSelectedRolePermissions([]);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/users', {
        ...formData,
        role_id: parseInt(formData.role_id)
      });
      toast.success('Administrador creado. Se ha enviado un correo con el magic link.');
      navigate('/dashboard/usuarios');
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al crear administrador';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '801px', margin: '0 auto' }}>
      <div className="info-panel" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>
          <div className="page-toolbar-title">
            <h1>Nuevo Administrador</h1>
            <p>Ingrese los datos del nuevo administrador</p>
          </div>
          <Link to="/dashboard/usuarios" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <HiOutlineArrowLeft /> Volver
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-compact">
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Nombre</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Apellidos</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Cédula / id</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                placeholder="100200300"
                value={formData.national_id}
                onChange={e => setFormData({...formData, national_id: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Email</label>
              <input
                type="email"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                placeholder="admin@universidad.edu.co"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Contraseña temporal</label>
              <input
                type="password"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'none' }}>Teléfono</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500, display: 'block', textTransform: 'none' }}>Rol del sistema</label>
              <select
                className="form-input"
                required
                value={formData.role_id}
                onChange={handleRoleChange}
                disabled={loadingRoles}
                style={{ padding: '0.35rem 0.8rem', height: '38px', fontSize: '0.9rem' }}
              >
                <option value="">Selecciona un rol...</option>
                {roles.filter(r => r.name !== 'estudiante').map(role => (
                  <option key={role.id} value={role.id}>
                    {role.description || role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRolePermissions.length > 0 && (
            <div className="role-permissions-preview" style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginTop: '1.5rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Permisos otorgados por este rol:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedRolePermissions.map(perm => (
                  <span key={perm.id} style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {perm.description || perm.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '2.5rem', 
            display: 'flex', 
            flexDirection: isMobile ? 'column-reverse' : 'row',
            justifyContent: isMobile ? 'stretch' : 'flex-end', 
            gap: '1rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid rgba(255,255,255,0.05)' 
          }}>
            <Link 
              to="/dashboard/usuarios" 
              className="btn btn-ghost" 
              disabled={loading}
              style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '1rem' }}
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ 
                width: isMobile ? '100%' : 'auto', 
                padding: '0.75rem 2rem', 
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              <HiOutlineUserAdd className="mr-2" style={{ verticalAlign: 'middle', marginRight: '8px', fontSize: '1.2rem' }} />
              {loading ? 'Procesando...' : 'Crear Administrador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
