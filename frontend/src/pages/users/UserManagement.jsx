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

/* ── USER ROW ─────────────────────────────── */
function UserRow({ admin, currentUser, onAction }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr 
      style={{ 
        borderBottom: '1px solid rgba(0,0,0,0.05)', 
        background: isHovered ? 'var(--bg-glass)' : 'transparent', 
        transition: 'background 0.2s ease' 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.85rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>
        {admin.national_id || '—'}
      </td>
      <td style={{ padding: '0.85rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>
        {admin.first_name} {admin.last_name}
      </td>
      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {admin.email}
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
        <span className={`header-badge role-${admin.role_name}`} style={{ fontSize: '0.7rem', padding: '3px 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {admin.role_name}
        </span>
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
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
      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {new Date(admin.created_at).toLocaleDateString()}
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
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
  
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Gestión de Administradores',
        subtitle: 'Crea y gestiona los administradores del sistema.'
      });
    }
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

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Administradores</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
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
                className="btn btn-ghost" 
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
                className="btn btn-ghost" 
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
              className="btn btn-primary" 
              style={{ height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', fontSize: '0.8rem', width: 'fit-content' }}
            >
              <HiOutlineUserAdd style={{ fontSize: '1rem' }} />
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {['Cédula', 'Nombre / Apellido', 'Correo', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.8rem' }}>{h}</th>
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
    </div>
  );
}
