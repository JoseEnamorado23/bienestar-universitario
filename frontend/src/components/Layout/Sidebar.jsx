import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMenuItems } from '../../utils/permissions';
import { ROLE_LABELS } from '../../utils/constants';
import { HiOutlineLogout, HiOutlineAcademicCap } from 'react-icons/hi';
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import logoUrl from '../../assets/logo.svg';

export default function Sidebar({ isOpen, onClose, onOpenNewLoan }) {
  const { user, permissions, logout } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

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

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand" style={{ justifyContent: 'center', padding: '10px' }}>
          <img src={logoUrl} alt="Bienestar Universitario" style={{ width: '170px', objectFit: 'contain' }} />
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

      </aside>
    </>
  );
}
