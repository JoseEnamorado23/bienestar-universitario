import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { 
  HiOutlineUserAdd, HiOutlineSearch, HiOutlinePencil, 
  HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle, 
  HiOutlineShieldCheck, HiOutlineUserCircle, HiOutlineFilter,
  HiOutlineSortAscending, HiOutlineSortDescending, HiOutlineChevronDown,
  HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import EditAdminModal from '../../components/modals/EditAdminModal';

/* ── ACTION BUTTON ────────────────────────── */
function ActionBtn({ icon, label, colorHex, onClick, isRowHovered }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const btnStyle = {
    position: 'relative',
    background: isBtnHovered ? `${colorHex}22` : (isRowHovered ? `${colorHex}12` : 'rgba(0,0,0,0.04)'),
    border: `1px solid ${isBtnHovered ? colorHex + '99' : (isRowHovered ? colorHex + '44' : 'rgba(0,0,0,0.12)')}`,
    color: isBtnHovered || isRowHovered ? colorHex : '#94a3b8',
    borderRadius: '8px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.95rem',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsBtnHovered(true)}
      onMouseLeave={() => setIsBtnHovered(false)}
      style={btnStyle}
    >
      {icon}
      {isBtnHovered && (
        <span style={{ 
          position: 'absolute', 
          bottom: 'calc(100% + 8px)', 
          right: '0', 
          background: '#1e293b', 
          color: '#fff', 
          fontSize: '0.72rem', 
          padding: '4px 10px', 
          borderRadius: '8px', 
          whiteSpace: 'nowrap', 
          pointerEvents: 'none', 
          zIndex: 10, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ── ROLE COLORS MAPPING ──────────────────── */
const ROLE_AVATAR_COLORS = {
  super_administrador: 'linear-gradient(135deg, #00acc9 0%, #008fa6 100%)',
  administrador_general: 'linear-gradient(135deg, #80ba27 0%, #6a9b20 100%)',
  administrador_prestamos: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  administrador_actividades: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
};

const getRoleAvatarBg = (roleName) => ROLE_AVATAR_COLORS[roleName] || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';

/* ── MOBILE ADMIN DETAILS MODAL (Bottom Sheet) ──────── */
function MobileAdminDetailsModal({ admin, currentUser, onClose, onAction }) {
  if (!admin) return null;

  const initials = (admin.first_name[0] + (admin.last_name ? admin.last_name[0] : '')).toUpperCase();
  const statusConfig = {
    ACTIVE:    { label: 'Activo',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  icon: <HiOutlineCheckCircle /> },
    INACTIVE:  { label: 'Pendiente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  icon: <HiOutlineXCircle />    },
    SUSPENDED: { label: 'Suspendido', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: <HiOutlineXCircle />    },
  };
  const st = statusConfig[admin.status] || statusConfig.ACTIVE;

  return (
    <div className="mobile-admin-details">
      <div className="details-overlay" onClick={onClose} />
      <div className="details-sheet">
        <div className="bottom-sheet-handle" />

        {/* Profile Header */}
        <div style={{ padding: '8px 20px 24px', textAlign: 'center' }}>
          <div style={{ 
            width: '72px', height: '72px', borderRadius: '50%', 
            background: getRoleAvatarBg(admin.role_name), 
            color: '#fff', fontSize: '1.5rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {initials}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {admin.first_name} {admin.last_name}
          </h3>
          <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {admin.email}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`header-badge role-${admin.role_name}`} style={{ fontSize: '0.7rem' }}>
              {admin.role_name}
            </span>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem',
              padding: '3px 10px', borderRadius: '9999px', fontWeight: 600,
              background: st.bg, color: st.color
            }}>
              {st.icon} {st.label}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
          background: 'rgba(0,0,0,0.04)', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{ padding: '14px 20px', background: 'var(--bg-primary)' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cédula</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 500 }}>{admin.national_id || '—'}</p>
          </div>
          <div style={{ padding: '14px 20px', background: 'var(--bg-primary)' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrado</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 500 }}>{new Date(admin.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            className="btn btn-ghost" 
            style={{ justifyContent: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }} 
            onClick={() => onAction('roles', admin)}
          >
            <HiOutlineShieldCheck style={{ color: '#a78bfa', fontSize: '1.2rem' }} /> Gestionar Permisos
          </button>
          <button 
            className="btn btn-ghost" 
            style={{ justifyContent: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }} 
            onClick={() => onAction('edit', admin)}
          >
            <HiOutlinePencil style={{ color: '#00acc9', fontSize: '1.2rem' }} /> Editar Información
          </button>
          {admin.id !== currentUser.id && (
            admin.status === 'SUSPENDED' ? (
              <button 
                className="btn btn-ghost" 
                style={{ justifyContent: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '0.9rem' }}
                onClick={() => onAction('activate', admin)}
              >
                <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} /> Activar
              </button>
            ) : (
              <button 
                className="btn btn-ghost" 
                style={{ justifyContent: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.9rem' }}
                onClick={() => onAction('suspend', admin)}
              >
                <HiOutlineTrash style={{ fontSize: '1.2rem' }} /> Suspender
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ── USER ROW ─────────────────────────────── */
function UserRow({ admin, currentUser, onAction, onRowClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const initials = (admin.first_name[0] + (admin.last_name ? admin.last_name[0] : '')).toUpperCase();

  return (
    <tr 
      style={{ 
        borderBottom: '1px solid rgba(0,0,0,0.05)', 
        background: isHovered ? 'var(--bg-glass)' : 'transparent', 
        transition: 'background 0.2s ease',
        cursor: 'pointer' 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (e.target.closest('button')) return;
        onRowClick && onRowClick(admin);
      }}
    >
      <td className="hide-on-mobile" data-label="Cédula" style={{ padding: '0.85rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>
        {admin.national_id || '—'}
      </td>
      <td data-label="Nombre / Apellido" style={{ padding: '0.85rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          {/* Avatar with status dot */}
          <div className="show-on-mobile" style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '50%', 
              background: getRoleAvatarBg(admin.role_name), 
              color: '#fff', fontSize: '0.85rem', fontWeight: 700, 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {initials}
            </div>
            <div style={{
              position: 'absolute', bottom: '0', right: '0',
              width: '12px', height: '12px', borderRadius: '50%',
              border: '2px solid var(--bg-primary)',
              background: admin.status === 'ACTIVE' ? '#4ade80' : admin.status === 'INACTIVE' ? '#fbbf24' : '#f87171'
            }} />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.9rem' }}>
                {admin.first_name} {admin.last_name}
              </span>
              <HiOutlineChevronRight className="show-on-mobile" style={{ color: 'var(--text-muted)', flexShrink: 0 }} size={16} />
            </div>
            {/* Role badge for mobile */}
            <div className="show-on-mobile" style={{ marginTop: '3px' }}>
               <span className={`header-badge role-${admin.role_name}`} style={{ fontSize: '0.6rem', padding: '1px 8px' }}>
                {admin.role_name}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="hide-on-mobile" data-label="Correo" style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {admin.email}
      </td>
      <td className="hide-on-mobile" data-label="Rol" style={{ padding: '0.85rem 1rem' }}>
        <span className={`header-badge role-${admin.role_name}`} style={{ fontSize: '0.7rem', padding: '3px 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {admin.role_name}
        </span>
      </td>
      <td className="hide-on-mobile" data-label="Estado" style={{ padding: '0.85rem 1rem' }}>
        {admin.status === 'ACTIVE' ? (
          <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <HiOutlineCheckCircle /> Activo
          </span>
        ) : admin.status === 'INACTIVE' ? (
          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <HiOutlineXCircle /> Pendiente
          </span>
        ) : (
          <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <HiOutlineXCircle /> Suspendido
          </span>
        )}
      </td>
      <td className="hide-on-mobile" data-label="Creado" style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {new Date(admin.created_at).toLocaleDateString()}
      </td>
      <td className="hide-on-mobile" data-label="Acciones" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ActionBtn 
            icon={<HiOutlineShieldCheck />} 
            label="Permisos" 
            colorHex="#a78bfa" 
            onClick={() => onAction('roles', admin)} 
            isRowHovered={isHovered}
          />
          <ActionBtn 
            icon={<HiOutlinePencil />} 
            label="Editar" 
            colorHex="#00acc9" 
            onClick={() => onAction('edit', admin)} 
            isRowHovered={isHovered}
          />
          {admin.id !== currentUser.id && (
            admin.status === 'SUSPENDED' ? (
              <ActionBtn 
                icon={<HiOutlineCheckCircle />} 
                label="Activar" 
                colorHex="#4ade80" 
                onClick={() => onAction('activate', admin)} 
                isRowHovered={isHovered}
              />
            ) : (
              <ActionBtn 
                icon={<HiOutlineTrash />} 
                label="Suspender" 
                colorHex="#f87171" 
                onClick={() => onAction('suspend', admin)} 
                isRowHovered={isHovered}
              />
            )
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  
  // States for query params
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ role_id: '', status: '' });
  const [sorting, setSorting] = useState({ sort_by: 'id', order: 'desc' });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedMobileAdmin, setSelectedMobileAdmin] = useState(null);
  
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    setHeaderContent({ 
      title: 'Administradores', 
      subtitle: 'Control de usuarios y permisos' 
    });
  }, [setHeaderContent]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/admin/roles');
      setRoles(data);
    } catch (e) {
      console.error('Error fetching roles', e);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
        search: search || undefined,
        role_id: filters.role_id || undefined,
        status: filters.status || undefined,
        sort_by: sorting.sort_by,
        order: sorting.order
      };
      const { data } = await api.get('/admin/users', { params });
      setAdmins(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (admin) => {
    const newStatus = admin.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const actionLabel = newStatus === 'ACTIVE' ? 'activar' : 'suspender';
    
    if (!window.confirm(`¿Estás seguro de que deseas ${actionLabel} a este administrador?`)) {
      return;
    }

    try {
      await api.patch(`/admin/users/${admin.id}/status`, { status: newStatus });
      toast.success(`Administrador ${newStatus === 'ACTIVE' ? 'activado' : 'suspendido'} correctamente`);
      fetchAdmins();
    } catch (err) {
      const message = err.response?.data?.detail || `Error al ${actionLabel} administrador`;
      toast.error(message);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchAdmins(); }, [page, limit, search, filters, sorting]);

  // Reset page to 1 when filters or search change
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleAction = (type, admin) => {
    if (type === 'roles') {
      navigate(`/dashboard/usuarios/permisos/${admin.id}`);
    } else if (type === 'edit') {
      setSelectedAdmin(admin);
      setIsEditModalOpen(true);
    } else if (type === 'suspend' || type === 'activate') {
      toggleAdminStatus(admin);
    } else {
      toast.error('Acción no implementada aún');
    }
  };

  const handleRowClick = (admin) => {
    // Only open the mobile modal if screen is small
    if (window.innerWidth <= 768) {
      setSelectedMobileAdmin(admin);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h1>Administradores</h1>
            <p>Control de usuarios y permisos</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
            {/* Search Bar */}
            <div className="mobile-search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar..."
                style={{ paddingLeft: '36px', marginBottom: 0, height: '38px', width: '100%' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filters Dropdown */}
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button 
                className="btn btn-ghost mobile-icon-only" 
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', border: '1px solid var(--border-color)', background: filters.role_id || filters.status ? 'var(--accent-primary)11' : 'transparent' }}
                onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
              >
                <HiOutlineFilter style={{ color: filters.role_id || filters.status ? 'var(--accent-primary)' : 'inherit' }} />
                <span style={{ fontSize: '0.85rem' }}>Filtros</span>
                <HiOutlineChevronDown style={{ fontSize: '0.75rem', opacity: 0.5 }} />
              </button>

              {showFilters && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '240px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Filtrar por:</div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rol</label>
                    <select 
                      className="form-input" 
                      style={{ marginBottom: 0, fontSize: '0.85rem' }}
                      value={filters.role_id}
                      onChange={e => setFilters(f => ({ ...f, role_id: e.target.value }))}
                    >
                      <option value="">Todos</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estado</label>
                    <select 
                      className="form-input" 
                      style={{ marginBottom: 0, fontSize: '0.85rem' }}
                      value={filters.status}
                      onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="">Todos</option>
                      <option value="ACTIVE">Activos</option>
                      <option value="INACTIVE">Pendientes</option>
                      <option value="SUSPENDED">Suspendidos</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }} ref={sortRef}>
              <button 
                className="btn btn-ghost mobile-icon-only" 
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', border: '1px solid var(--border-color)' }}
                onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
              >
                {sorting.order === 'desc' ? <HiOutlineSortDescending /> : <HiOutlineSortAscending />}
                <span style={{ fontSize: '0.85rem' }}>Ordenar</span>
                <HiOutlineChevronDown style={{ fontSize: '0.75rem', opacity: 0.5 }} />
              </button>

              {showSort && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '220px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Ordenar por:</div>
                  
                  <select 
                    className="form-input" 
                    style={{ marginBottom: 0, fontSize: '0.85rem' }}
                    value={sorting.sort_by}
                    onChange={e => setSorting(s => ({ ...s, sort_by: e.target.value }))}
                  >
                    <option value="id">Más Recientes</option>
                    <option value="first_name">Nombre</option>
                    <option value="last_name">Apellido</option>
                    <option value="email">Correo</option>
                    <option value="role">Rol</option>
                    <option value="status">Estado</option>
                  </select>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`btn ${sorting.order === 'asc' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: '0.75rem', height: '32px', border: '1px solid var(--border-color)' }}
                      onClick={() => setSorting(s => ({ ...s, order: 'asc' }))}
                    >
                      ASC
                    </button>
                    <button 
                      className={`btn ${sorting.order === 'desc' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: '0.75rem', height: '32px', border: '1px solid var(--border-color)' }}
                      onClick={() => setSorting(s => ({ ...s, order: 'desc' }))}
                    >
                      DESC
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link 
              to="/dashboard/crear-admin"
              className="btn btn-primary mobile-fab" 
              style={{ height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', fontSize: '0.8rem', width: 'fit-content' }}
            >
              <HiOutlineUserAdd style={{ fontSize: '1.2rem' }} />
              <span style={{ whiteSpace: 'nowrap' }}>Nuevo Admin</span>
            </Link>

            {/* Reset Button */}
            {(filters.role_id || filters.status || search || sorting.sort_by !== 'id' || sorting.order !== 'desc') && (
              <button 
                className="btn btn-ghost"
                style={{ height: '38px', width: '38px', padding: 0, border: '1px solid var(--border-color)', color: '#ef4444' }}
                title="Limpiar filtros"
                onClick={() => {
                  setFilters({ role_id: '', status: '' });
                  setSorting({ sort_by: 'id', order: 'desc' });
                  setSearch('');
                  setShowFilters(false);
                  setShowSort(false);
                }}
              >
                <HiOutlineTrash />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            Cargando administradores...
          </div>
        ) : (
          <>
            <div className="profile-list-wrapper" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <table className="responsive-table profile-list" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                    {['Cédula', 'Nombre / Apellido', 'Correo', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <UserRow 
                      key={admin.id} 
                      admin={admin} 
                      currentUser={user} 
                      onAction={handleAction} 
                      onRowClick={handleRowClick}
                    />
                  ))}
                  
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No se encontraron administradores.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{admins.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> administradores
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filas:</span>
                  <select 
                    className="form-input" 
                    style={{ width: '70px', marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                    value={limit}
                    onChange={e => setLimit(parseInt(e.target.value))}
                  >
                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.4rem', minWidth: '36px' }} 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <HiOutlineChevronLeft />
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Página {page} de {Math.ceil(total / limit) || 1}
                  </div>

                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.4rem', minWidth: '36px' }} 
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <HiOutlineChevronRight />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <EditAdminModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAdmin(null);
        }}
        onSuccess={fetchAdmins}
        admin={selectedAdmin}
      />
      {selectedMobileAdmin && (
        <MobileAdminDetailsModal 
          admin={selectedMobileAdmin} 
          currentUser={user} 
          onClose={() => setSelectedMobileAdmin(null)} 
          onAction={(actionType, actAdmin) => {
            setSelectedMobileAdmin(null);
            handleAction(actionType, actAdmin);
          }} 
        />
      )}
    </div>
  );
}
