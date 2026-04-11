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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="bottom-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet-content">
        <div className="bottom-sheet-handle" />
        
        <div className="modal-header" style={{ padding: '1.25rem 1.75rem 0.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <HiOutlinePencil style={{ color: 'var(--primary-color)' }} /> Editar información
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '1rem 1.75rem 1.75rem' }}>
          <div className="form-grid-compact" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
            gap: isMobile ? '1rem' : '1.25rem',
            marginBottom: '1.5rem' 
          }}>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Nombre</label>
              <input
                type="text"
                className="form-input"
                style={{ height: '42px' }}
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
                style={{ height: '42px' }}
                required
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Correo electrónico</label>
              <input
                type="email"
                className="form-input"
                style={{ height: '42px' }}
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Teléfono (opcional)</label>
              <input
                type="text"
                className="form-input"
                style={{ height: '42px' }}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group mb-0" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)' }}>Estado de la cuenta</label>
              <select
                className="form-input"
                style={{ height: '42px' }}
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

          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)', 
            marginTop: '0.5rem', 
            background: 'var(--bg-glass)', 
            padding: '1rem', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            lineHeight: '1.4'
          }}>
            <strong>Nota:</strong> Para cambiar el rol o los permisos específicos, utiliza la opción avanzada de "Permisos" en la lista de administradores.
          </div>

          <div style={{ 
            marginTop: '2rem', 
            display: 'flex', 
            flexDirection: isMobile ? 'column-reverse' : 'row',
            justifyContent: 'flex-end', 
            gap: '1rem' 
          }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose} 
              disabled={loading}
              style={{ height: '48px', justifyContent: 'center', minWidth: isMobile ? '100%' : '140px' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ height: '48px', justifyContent: 'center', minWidth: isMobile ? '100%' : '200px' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
