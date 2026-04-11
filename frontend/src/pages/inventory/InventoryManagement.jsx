import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, 
  HiOutlineCube, HiOutlinePhotograph, HiOutlineSearch,
  HiOutlineFilter, HiOutlineChevronDown, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineSortAscending, HiOutlineSortDescending,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ItemModal from './ItemModal';
import { useAuth } from '../../hooks/useAuth';

/* ── ACTION BUTTON ────────────────────────── */
function ActionBtn({ icon, label, colorHex, onClick, isRowHovered, disabled }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  if (disabled && !isBtnHovered) {
    // If disabled, we might still want to show it but faded, 
    // or just return null if it's a "Delete" on an already inactive item.
  }

  const btnStyle = {
    position: 'relative',
    background: isBtnHovered ? `${colorHex}22` : (isRowHovered ? `${colorHex}12` : 'rgba(0,0,0,0.04)'),
    border: `1px solid ${isBtnHovered ? colorHex + '99' : (isRowHovered ? colorHex + '44' : 'rgba(0,0,0,0.12)')}`,
    color: isBtnHovered || isRowHovered ? colorHex : '#94a3b8',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsBtnHovered(true)}
      onMouseLeave={() => setIsBtnHovered(false)}
      style={btnStyle}
      disabled={disabled}
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

/* ── ITEM ROW ─────────────────────────────── */
function ItemRow({ item, onEdit, onStatusChange }) {
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
      <td data-label="Implemento" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'var(--bg-glass)', 
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {item.image_url ? (
              <img src={`http://${window.location.hostname}:8000${item.image_url}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <HiOutlinePhotograph size={22} color="var(--text-muted)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.name}</div>
            {item.description && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td data-label="Disponible" style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
        <span style={{ 
          fontWeight: 700, 
          fontSize: '1.1rem', 
          color: item.available_quantity > 0 ? '#80ba27' : '#ef4444',
          background: item.available_quantity > 0 ? 'rgba(128,186,39,0.1)' : 'rgba(239,68,68,0.1)',
          padding: '4px 12px',
          borderRadius: '8px'
        }}>
          {item.available_quantity}
        </span>
      </td>
      <td data-label="Total" style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
        {item.total_quantity}
      </td>
      <td data-label="Estado" style={{ padding: '0.85rem 1rem' }}>
        <span style={{ 
          fontSize: '0.7rem', 
          padding: '3px 10px', 
          borderRadius: '20px', 
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: item.status === 'ACTIVE' ? 'rgba(128,186,39,0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: item.status === 'ACTIVE' ? '#80ba27' : '#ef4444',
          border: `1px solid ${item.status === 'ACTIVE' ? 'rgba(128,186,39,0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td data-label="Acciones" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <ActionBtn 
            icon={<HiOutlinePencilAlt />} 
            label="Editar" 
            colorHex="#00acc9" 
            onClick={() => onEdit(item)} 
            isRowHovered={isHovered}
          />
          {item.status === 'ACTIVE' ? (
            <ActionBtn 
              icon={<HiOutlineTrash />} 
              label="Inhabilitar" 
              colorHex="#ef4444" 
              onClick={() => onStatusChange(item, 'INACTIVE')} 
              isRowHovered={isHovered}
            />
          ) : (
            <ActionBtn 
              icon={<HiOutlineCheckCircle />} 
              label="Reactivar" 
              colorHex="#80ba27" 
              onClick={() => onStatusChange(item, 'ACTIVE')} 
              isRowHovered={isHovered}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for filtering and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Inventario de Implementos',
        subtitle: 'Gestiona los artículos deportivos y de bienestar disponibles para préstamos.'
      });
    }
  }, [setHeaderContent]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // In a real app, these would be backend params
      const { data } = await api.get('/inventory/');
      setItems(data);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (item, newStatus) => {
    const isActivating = newStatus === 'ACTIVE';
    const action = isActivating ? 'reactivar' : 'inhabilitar';
    if (!window.confirm(`¿Estás seguro de ${action} este implemento?`)) return;
    
    try {
      if (isActivating) {
        await api.put(`/inventory/${item.id}`, { status: 'ACTIVE' });
        toast.success('Implemento reactivado correctamente');
      } else {
        await api.delete(`/inventory/${item.id}`);
        toast.success('Implemento inhabilitado correctamente');
      }
      fetchItems();
    } catch (err) {
      toast.error(`Error al ${action} el artículo`);
    }
  };

  const onModalSave = () => {
    setIsModalOpen(false);
    fetchItems();
  };

  // Logic for local filtering and search (since base API doesn't seem to support it yet)
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = filteredItems.length;
  const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

  if (loading) {
    return <div className="page-loading"><div className="page-loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        {/* Table Header with Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(128,186,39,0.1)', color: '#80ba27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineCube size={24} />
            </div>
            <h3 style={{ margin: 0 }}>Implementos</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
             {/* Search Bar */}
             <div style={{ position: 'relative', flex: 1, maxWidth: '350px', display: 'flex', alignItems: 'center' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar implemento..."
                style={{ paddingLeft: '36px', marginBottom: 0, height: '40px', width: '100%', borderRadius: '10px' }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Filters */}
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button 
                className="btn btn-ghost" 
                style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: statusFilter !== 'ALL' ? 'rgba(128,186,39,0.08)' : 'transparent' }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <HiOutlineFilter style={{ color: statusFilter !== 'ALL' ? '#80ba27' : 'inherit' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Filtros</span>
                <HiOutlineChevronDown style={{ fontSize: '0.85rem', opacity: 0.5 }} />
              </button>

              {showFilters && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', zIndex: 50, boxShadow: '0 15px 35px rgba(0,0,0,0.12)', width: '240px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Estado del Implemento</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['ALL', 'ACTIVE', 'INACTIVE'].map(val => (
                      <button
                        key={val}
                        onClick={() => { setStatusFilter(val); setPage(1); setShowFilters(false); }}
                        style={{ 
                          padding: '8px 12px', 
                          textAlign: 'left', 
                          background: statusFilter === val ? 'rgba(128,186,39,0.1)' : 'transparent',
                          color: statusFilter === val ? '#80ba27' : 'var(--text-primary)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: statusFilter === val ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {val === 'ALL' ? 'Todos' : val === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleCreate}
              style={{ height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', fontSize: '0.85rem', width: 'fit-content' }}
            >
              <HiOutlinePlus size={18} />
              <span style={{ fontWeight: 600 }}>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Implemento</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Disponible</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Total</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <ItemRow 
                  key={item.id} 
                  item={item} 
                  onEdit={handleEdit} 
                  onStatusChange={handleStatusChange} 
                />
              ))}
              
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <HiOutlineCube size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>No se encontraron implementos registrados.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Mostrando <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{paginatedItems.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> artículos
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filas:</span>
              <select 
                className="form-input" 
                style={{ width: '70px', marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.85rem', borderRadius: '8px' }}
                value={limit}
                onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.4rem', minWidth: '36px', borderRadius: '8px' }} 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <HiOutlineChevronLeft />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                {page} / {Math.ceil(total / limit) || 1}
              </div>

              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.4rem', minWidth: '36px', borderRadius: '8px' }} 
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(p => p + 1)}
              >
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedItem={selectedItem}
        onSave={onModalSave}
      />
    </div>
  );
}
