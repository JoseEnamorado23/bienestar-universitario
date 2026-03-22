import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function EditAdminModal({ isOpen, onClose, onSuccess, admin }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && admin) {
      setFormData({
        first_name: admin.first_name || '',
        last_name: admin.last_name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        status: admin.status || 'ACTIVE'
      });
    }
  }, [isOpen, admin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/admin/users/${admin.id}`, formData);
      toast.success('Administrador actualizado correctamente.');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al actualizar administrador';
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
          <h2><HiOutlinePencil className="mr-2" style={{ verticalAlign: 'middle' }} /> Editar Administrador</h2>
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
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
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
            
            <div className="form-group mb-0" style={{ gridColumn: 'span 2' }}>
              <label>Estado del Usuario</label>
              <select
                className="form-input"
                required
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">Activo - Acceso permitido</option>
                <option value="INACTIVE">Pendiente - Esperando verificación</option>
                <option value="SUSPENDED">Suspendido - Acceso denegado</option>
              </select>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
            <strong>Nota:</strong> Para cambiar el rol o los permisos específicos de este administrador, por favor utiliza la opción de "Permisos" en la lista principal.
          </p>

          <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
