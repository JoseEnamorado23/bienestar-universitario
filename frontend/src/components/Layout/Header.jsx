import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import { HiOutlineMenuAlt2, HiOutlineCog, HiOutlineLogout, HiOutlineInbox } from 'react-icons/hi';
import api from '../../api/axios';

export default function Header({ title, subtitle, onToggleSidebar, onOpenSettings }) {
  const { user, logout, permissions } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingLoans, setPendingLoans] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll pending loan requests every 30s
  useEffect(() => {
    const hasPerm = permissions?.includes('loan:approve') || permissions?.includes('loan:read:all');
    if (!hasPerm) return;

    const fetchPending = async () => {
      try {
        const { data } = await api.get('/loans/', { params: { status: 'SOLICITADO', limit: 1 } });
        setPendingLoans(data.total || 0);
      } catch (e) {
        // silently fail
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [permissions]);

  const getInitials = () => {
    const first = user?.first_name?.[0] || user?.email?.[0] || 'U';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  if (!user) return null;

  return (
    <header className="header" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 200px', alignItems: 'center' }}>
      <div className="header-left">
        <button className="header-burger" onClick={onToggleSidebar}>
          <HiOutlineMenuAlt2 />
        </button>
      </div>

      <div className="header-center" style={{ textAlign: 'center' }}>
        <div className="header-title">
          <h1 style={{ color: title === 'Tablero Kanban' ? 'var(--accent-primary)' : 'inherit', margin: 0, fontSize: '1.2rem' }}>{title || 'Sistema de Bienestar'}</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{subtitle || 'Universidad — Panel de Control'}</p>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
        <button 
          onClick={onOpenSettings}
          style={{ 
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Configuraciones del Sistema"
        >
          <HiOutlineCog size={28} style={{ verticalAlign: 'middle' }} />
        </button>

        {/* Pending Loans Notification */}
        {pendingLoans > 0 && (
          <button
            onClick={() => navigate('/dashboard/prestamos/tablero')}
            title={`${pendingLoans} préstamo(s) pendiente(s) de aprobación`}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <HiOutlineInbox size={28} style={{ verticalAlign: 'middle' }} />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              borderRadius: '9999px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {pendingLoans}
            </span>
          </button>
        )}
        
        <div className="header-profile" ref={profileRef} style={{ position: 'relative' }}>
          <button 
            className="header-avatar" 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: '#00acc9', 
              color: 'var(--bg-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {getInitials()}
          </button>
          
          {isProfileOpen && (
            <div className="profile-dropdown animate-scale-in" style={{
              position: 'absolute',
              top: '120%',
              right: '0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              width: '260px',
              padding: 'var(--space-md)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)'
            }}>
              <div style={{ paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-xs)' }}>
                <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, fontSize: '1rem' }}>
                  {user.first_name} {user.last_name}
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {user.email}
                </p>
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  <span className={`header-badge role-${user.role}`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-ghost" 
                onClick={handleLogout}
                style={{ justifyContent: 'flex-start', color: 'var(--error)' }}
              >
                <HiOutlineLogout size={18} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
