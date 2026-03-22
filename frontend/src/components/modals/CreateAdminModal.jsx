import { useState, useEffect } from 'react';
import { HiOutlineUserAdd, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CreateAdminModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_id: ''
  });
  
  const [roles, setRoles] = useState([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      // Reset form
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role_id: ''
      });
      setSelectedRolePermissions([]);
    }
  }, [isOpen]);

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
      toast.success('Administrador creado. Revisa la consola del backend para el magic link.');
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al crear administrador';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2><HiOutlineUserAdd className="mr-2" style={{ verticalAlign: 'middle' }} /> Crear Administrador</h2>
          <button className="btn-icon" onClick={onClose}><HiOutlineX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body p-4">
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group mb-0">
              <label>Nombre</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label>Apellidos</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label>Email</label>
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
              <label>Contraseña Temporal</label>
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
              <label>Teléfono (Opcional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label>Rol</label>
              <select
                className="form-input"
                required
                value={formData.role_id}
                onChange={handleRoleChange}
                disabled={loadingRoles}
              >
                <option value="">Selecciona un rol...</option>
                {roles.filter(r => r.name !== 'student').map(role => (
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
              padding: '1rem',
              marginTop: '1rem' 
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Permisos otorgados por este rol:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedRolePermissions.map(perm => (
                  <span key={perm.id} style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    borderRadius: '4px',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {perm.description || perm.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
