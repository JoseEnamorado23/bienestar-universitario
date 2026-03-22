import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HiOutlineUser, HiOutlineKey, HiOutlineMail, HiOutlinePhone, HiOutlineShieldCheck } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Profile() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Mi Perfil',
        subtitle: 'Administra tu información personal y seguridad de la cuenta.'
      });
    }
  }, [setHeaderContent]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cambiar la contraseña';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="info-panel" style={{ margin: 0 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <HiOutlineUser /> Datos Personales
            </h3>
            
            <div className="info-row">
              <span className="info-row-label">Nombre Completo</span>
              <span className="info-row-value">{user.first_name} {user.last_name}</span>
            </div>
            
            <div className="info-row">
              <span className="info-row-label">
                <HiOutlineMail style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> 
                Correo Electrónico
              </span>
              <span className="info-row-value">{user.email}</span>
            </div>
            
            <div className="info-row">
              <span className="info-row-label">
                <HiOutlinePhone style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> 
                Teléfono
              </span>
              <span className="info-row-value">{user.phone || 'No registrado'}</span>
            </div>
          </div>

          <div className="info-panel" style={{ margin: 0 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <HiOutlineShieldCheck /> Información de Cuenta
            </h3>
            
            <div className="info-row">
              <span className="info-row-label">Rol del Sistema</span>
              <span className="info-row-value">
                <span className={`header-badge role-${user.role}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-row-label">Estado de la Cuenta</span>
              <span className="info-row-value">
                {user.status === 'ACTIVE' ? (
                  <span style={{ color: '#4ade80' }}>● Activo</span>
                ) : (
                  <span style={{ color: '#fbbf24' }}>● Pendiente</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Security Column */}
        <div>
          <div className="info-panel" style={{ margin: 0, height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <HiOutlineKey /> Seguridad
            </h3>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <div style={{ marginTop: '2rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
