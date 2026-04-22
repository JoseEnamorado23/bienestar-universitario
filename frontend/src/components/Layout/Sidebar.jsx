import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMenuItems } from '../../utils/permissions';
import { ROLE_LABELS } from '../../utils/constants';
import { HiOutlineLogout, HiOutlineCog, HiOutlineBell, HiDotsHorizontal } from 'react-icons/hi';
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import logoUrl from '../../assets/logo.svg';
import api from '../../api/axios';

export default function Sidebar({ isOpen, onClose, onOpenNewLoan, onOpenSettings, isSettingsOpen }) {
  const { user, permissions, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingLoans, setPendingLoans] = useState(0);
  const profileRef = useRef(null);

  // Manejar click fuera del perfil
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll para notificaciones de préstamos
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

  useEffect(() => {
    // Si la ruta cambia y corresponde a un submenu, abrirlo automáticamente
    const menuItems = getMenuItems(permissions);
    const activeParent = menuItems.find(item => 
      item.children && item.children.some(child => location.pathname.startsWith(child.path))
    );
    if (activeParent) {
      setOpenSubmenu(activeParent.id);
    }
  }, [location.pathname, permissions]);

  if (!user) return null;

  const toggleSubmenu = (id) => {
    setOpenSubmenu(prev => prev === id ? null : id);
  };

  const menuItems = getMenuItems(permissions);

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const handleLinkClick = (e, child) => {
    if (child.id === 'loans-new') {
      e.preventDefault();
      onOpenNewLoan();
      onClose();
    } else {
      onClose();
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || user?.email?.[0] || 'U';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <img src={logoUrl} alt="Bienestar Universitario" style={{ width: '160px', objectFit: 'contain' }} />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navegación</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isSubmenuOpen = openSubmenu === item.id;
            
            // Check if any child is active
            const isChildActive = hasChildren && item.children.some(child => isActive(child.path));

            if (hasChildren) {
              return (
                <div key={item.id} className="sidebar-item-group">
                  <div 
                    className={`sidebar-item ${isChildActive ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.id)}
                    style={{ cursor: 'pointer', justifyContent: 'space-between', display: 'flex' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="sidebar-item-icon"><Icon /></span>
                      <span>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '1.2rem', display: 'flex' }}>
                      {isSubmenuOpen ? <BiChevronDown /> : <BiChevronRight />}
                    </span>
                  </div>
                  
                  {isSubmenuOpen && (
                    <div className="sidebar-submenu" style={{ marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {item.children.map(child => (
                        <Link
                          key={child.id}
                          to={child.path}
                          className={`sidebar-item ${isActive(child.path) ? 'active' : ''}`}
                          onClick={(e) => handleLinkClick(e, child)}
                          style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {child.icon && <span className="sidebar-item-icon" style={{ fontSize: '1rem' }}><child.icon /></span>}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (item.id === 'settings') {
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${isSettingsOpen ? 'active' : ''}`}
                  onClick={() => { onOpenSettings(); onClose(); }}
                >
                  <span className="sidebar-item-icon">
                    <Icon />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-item-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Profile & Actions */}
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#80ba27', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
            }}>
              {getInitials()}
            </div>
            <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email.split('@')[0]}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s ease' }}
            >
              <HiDotsHorizontal size={18} />
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown animate-scale-in" style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                right: '0',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '240px',
                padding: 'var(--space-sm)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user.first_name || 'Usuario'} {user.last_name || ''}</p>
                    <span className={`header-badge role-${user.role}`} style={{ marginTop: '6px', display: 'inline-flex', padding: '2px 8px', fontSize: '0.65rem' }}>{ROLE_LABELS[user.role] || user.role}</span>
                </div>
                <button className="sidebar-item" onClick={handleLogout} style={{ margin: 0, padding: '10px 12px', border: 'none', background: 'transparent', width: '100%', color: 'var(--error)' }}>
                  <HiOutlineLogout size={20} style={{ color: 'var(--error)' }} /> Cerrar Sesión
                </button>
              </div>
            )}

            <button
              onClick={() => { navigate('/dashboard/prestamos/tablero'); onClose(); }}
              title="Notificaciones de préstamos"
              style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', position: 'relative', transition: 'all 0.2s ease' }}
            >
              <HiOutlineBell size={18} />
              {pendingLoans > 0 && (
                <span style={{ position: 'absolute', top: '-1px', right: '-2px', background: '#007bff', border: '2px solid var(--bg-secondary)', borderRadius: '50%', width: '12px', height: '12px' }} />
              )}
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
