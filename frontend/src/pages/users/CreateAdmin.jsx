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
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard/usuarios" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}>
          <HiOutlineArrowLeft /> Volver a Administradores
        </Link>
      </div>

      <div className="info-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-compact" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Nombre</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Apellidos</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Cédula / ID</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="100200300"
                value={formData.national_id}
                onChange={e => setFormData({...formData, national_id: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                className="form-input"
                required
                placeholder="admin@universidad.edu.co"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Contraseña Temporal</label>
              <input
                type="password"
                className="form-input"
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Teléfono</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500, display: 'block' }}>Rol del Sistema</label>
              <select
                className="form-input"
                required
                value={formData.role_id}
                onChange={handleRoleChange}
                disabled={loadingRoles}
                style={{ padding: '0.5rem 0.75rem' }}
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

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link to="/dashboard/usuarios" className="btn btn-ghost" disabled={loading}>
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
              <HiOutlineUserAdd className="mr-2" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              {loading ? 'Procesando...' : 'Crear Administrador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
