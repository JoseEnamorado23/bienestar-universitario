import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  HiOutlineSearch, HiOutlineCheckCircle, HiOutlineClock, 
  HiOutlineRefresh, HiOutlineX, HiOutlineBan, HiOutlineDocumentText,
  HiOutlineCube, HiOutlineAcademicCap, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineFilter, HiOutlineSortDescending,
  HiOutlineSortAscending, HiOutlineChevronDown, HiOutlineTrash,
  HiOutlinePhone, HiOutlineMail, HiOutlineDuplicate, HiOutlinePlus
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { hasPermission } from '../../utils/permissions';
import { PERMISSIONS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import ReportModal from '../../components/reports/ReportModal';
import { HiOutlineDocumentReport } from 'react-icons/hi';

/* ── ACTION BUTTON ────────────────────────── */
function ActionBtn({ icon, label, colorHex, onClick, isRowHovered, disabled }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  if (disabled) return null;

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
    cursor: 'pointer',
    fontSize: '1rem',
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

/* ── LOAN ROW ─────────────────────────────── */
function LoanRow({ loan, onApprove, onReject, onReturn, onContact }) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'SOLICITADO': return { bg: 'rgba(240, 147, 251, 0.12)', color: '#f093fb', label: 'Solicitado' };
      case 'ACTIVO': return { bg: 'rgba(0, 172, 201, 0.12)', color: '#00acc9', label: 'Activo' };
      case 'VENCIDO': return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', label: 'Vencido' };
      case 'DEVUELTO': return { bg: 'rgba(128, 186, 39, 0.12)', color: '#80ba27', label: 'Devuelto' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', label: status };
    }
  };

  const status = getStatusStyle(loan.status);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CO', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

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
      <td style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{loan.student.first_name} {loan.student.last_name}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CC: {loan.student.document_id}</span>
        </div>
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{loan.item.name}</span>
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {loan.student.program_name || '—'}
        </div>
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
        <span style={{ 
          padding: '2px 10px', 
          borderRadius: '20px', 
          background: status.bg, 
          color: status.color, 
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {status.label}
        </span>
      </td>
      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {formatDate(loan.start_time)}
      </td>
      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {loan.status === 'DEVUELTO' ? formatDate(loan.returned_time) : formatDate(loan.expected_return_time)}
      </td>
      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: loan.hours_earned > 0 ? '#80ba27' : 'var(--text-muted)', fontSize: '0.875rem' }}>
        {loan.hours_earned > 0 ? `+${loan.formatted_hours_earned || loan.hours_earned}` : '—'}
      </td>
      <td style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ActionBtn 
            icon={<HiOutlinePhone />} 
            label="Contacto" 
            colorHex="#cad400" 
            onClick={() => onContact(loan.student)} 
            isRowHovered={isHovered}
          />
          {loan.status === 'SOLICITADO' && (
            <>
              <ActionBtn 
                icon={<HiOutlineCheckCircle />} 
                label="Aprobar" 
                colorHex="#4ade80" 
                onClick={() => onApprove(loan.id)} 
                isRowHovered={isHovered}
              />
              <ActionBtn 
                icon={<HiOutlineBan />} 
                label="Rechazar" 
                colorHex="#f87171" 
                onClick={() => onReject(loan.id)} 
                isRowHovered={isHovered}
              />
            </>
          )}
          {(loan.status === 'ACTIVO' || loan.status === 'VENCIDO') && (
            <ActionBtn 
              icon={<HiOutlineRefresh />} 
              label="Devolver" 
              colorHex="#00acc9" 
              onClick={() => onReturn(loan.id)} 
              isRowHovered={isHovered}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

export default function LoanManagement() {
  const { setHeaderContent, onOpenNewLoan } = useOutletContext();
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);

  // States for query params
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ program_id: '', status: '', time: '' });
  const [sorting, setSorting] = useState({ sort_by: 'created_at', order: 'desc' });

  const [rejectModal, setRejectModal] = useState({ open: false, loanId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [contactModal, setContactModal] = useState({ open: false, student: null });
  const [showReportModal, setShowReportModal] = useState(false);
  const { user } = useAuth();

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Gestión de Préstamos',
        subtitle: 'Audita y gestiona las solicitudes de implementos deportivos y académicos.'
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

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (e) {
      console.error('Error fetching programs', e);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
        search: search || undefined,
        program_id: filters.program_id || undefined,
        status: filters.status || undefined,
        time_filter: filters.time || undefined,
        sort_by: sorting.sort_by,
        order: sorting.order
      };
      const { data } = await api.get('/loans/', { params });
      setLoans(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error('Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { fetchLoans(); }, [page, limit, search, filters, sorting]);

  // Establish WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'loan_created' || data.type === 'loan_updated') {
            console.log('Real-time update received in list:', data);
            fetchLoans();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected from list, attempting reconnect...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error in list:', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Reset page when search or filters change
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/loans/${id}/approve`);
      toast.success('Préstamo aprobado');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al aprobar');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debes ingresar el motivo del rechazo.');
      return;
    }
    setRejecting(true);
    try {
      await api.put(`/loans/${rejectModal.loanId}/reject`, { reason: rejectReason });
      toast.success('Solicitud rechazada.');
      setRejectModal({ open: false, loanId: null });
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al rechazar');
    } finally {
      setRejecting(false);
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('¿Confirmar devolución e imputar horas sociales?')) return;
    try {
      await api.put(`/loans/${id}/return`);
      toast.success(`¡Devuelto con éxito! Se han registrado las horas sociales.`);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al devolver');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header with Search & Filters Toggle */}
      <div className="info-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Préstamos</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar (estudiante, CC, implemento)..."
                style={{ paddingLeft: '36px', marginBottom: 0, height: '38px', width: '100%' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filters Dropdown */}
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button 
                className="btn btn-ghost" 
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', border: '1px solid var(--border-color)', background: (filters.program_id || filters.status || filters.time) ? 'var(--accent-primary)11' : 'transparent' }}
                onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
              >
                <HiOutlineFilter style={{ color: (filters.program_id || filters.status || filters.time) ? 'var(--accent-primary)' : 'inherit' }} />
                <span style={{ fontSize: '0.85rem' }}>Filtros</span>
                <HiOutlineChevronDown style={{ fontSize: '0.75rem', opacity: 0.5 }} />
              </button>

              {showFilters && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '240px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Filtrar por:</div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carrera</label>
                    <select 
                      className="form-input" 
                      style={{ marginBottom: 0, fontSize: '0.85rem' }}
                      value={filters.program_id}
                      onChange={e => setFilters(f => ({ ...f, program_id: e.target.value }))}
                    >
                      <option value="">Todas</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                      <option value="SOLICITADO">Solicitados</option>
                      <option value="ACTIVO">Activos</option>
                      <option value="VENCIDO">Vencidos</option>
                      <option value="DEVUELTO">Devueltos</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tiempo</label>
                    <select 
                      className="form-input" 
                      style={{ marginBottom: 0, fontSize: '0.85rem' }}
                      value={filters.time}
                      onChange={e => setFilters(f => ({ ...f, time: e.target.value }))}
                    >
                      <option value="">Cualquier fecha</option>
                      <option value="TODAY">Hoy</option>
                      <option value="WEEK">Última Semana</option>
                      <option value="MONTH">Este Mes</option>
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
                    <option value="created_at">Fecha de Creación</option>
                    <option value="start_time">Fecha de Inicio</option>
                    <option value="status">Estado</option>
                    <option value="hours">Horas Ganadas</option>
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

            {/* Report Button */}
            {user && hasPermission(user.permissions, PERMISSIONS.REPORT_LOANS) && (
              <button 
                className="btn btn-primary" 
                style={{ height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', fontSize: '0.85rem', width: 'fit-content' }}
                onClick={() => setShowReportModal(true)}
              >
                <HiOutlineDocumentReport style={{ fontSize: '1.1rem' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Reporte</span>
              </button>
            )}

            {/* Add New Loan Button */}
            <button 
              className="btn btn-primary" 
              style={{ height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', fontSize: '0.85rem', width: 'fit-content' }}
              onClick={onOpenNewLoan}
            >
              <HiOutlinePlus style={{ fontSize: '1.1rem' }} />
              <span style={{ whiteSpace: 'nowrap' }}>Préstamo</span>
            </button>

            {/* Reset Button */}
            {(filters.program_id || filters.status || filters.time || search || sorting.sort_by !== 'created_at' || sorting.order !== 'desc') && (
              <button 
                className="btn btn-ghost"
                style={{ height: '38px', width: '38px', padding: 0, border: '1px solid var(--border-color)', color: '#ef4444' }}
                title="Limpiar filtros"
                onClick={() => {
                  setFilters({ program_id: '', status: '', time: '' });
                  setSorting({ sort_by: 'created_at', order: 'desc' });
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

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            Cargando préstamos...
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {['Estudiante', 'Implemento', 'Programa', 'Estado', 'Inicio', 'Límite / Fin', 'Horas', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <LoanRow 
                      key={loan.id} 
                      loan={loan} 
                      onApprove={handleApprove}
                      onReject={(id) => setRejectModal({ open: true, loanId: id })}
                      onReturn={handleReturn}
                      onContact={(student) => setContactModal({ open: true, student })}
                    />
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '4rem', textAlign: 'center' }}>
                        <HiOutlineDocumentText size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No se encontraron préstamos.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loans.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> registros
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

      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} type="loans" />
      <RejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, loanId: null })}
        onConfirm={handleReject}
        reason={rejectReason}
        setReason={setRejectReason}
        loading={rejecting}
      />

      <ContactModal 
        open={contactModal.open}
        onClose={() => setContactModal({ open: false, student: null })}
        student={contactModal.student}
      />
    </div>
  );
}

/* ─── Reject Modal ─────────────────────────────────────────── */
function RejectModal({ open, onClose, onConfirm, reason, setReason, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="info-panel animate-scale-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineBan size={22} />
            </div>
            <h3 style={{ margin: 0 }}>Rechazar Solicitud</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)' }}><HiOutlineX size={18} /></button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Por favor indica el motivo del rechazo. El estudiante recibirá una notificación con esta explicación.
        </p>
        
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Motivo del rechazo</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Ej: Implemento no disponible para esta fecha..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button
            className="btn"
            style={{ background: '#ef4444', color: 'white', fontWeight: 600 }}
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Modal ────────────────────────────────────────── */
function ContactModal({ open, onClose, student }) {
  if (!open || !student) return null;

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado`, {
      id: 'copy-toast', // Prevent multiple toasts
      style: { fontSize: '0.8rem', padding: '6px 12px' }
    });
  };

  const VERDE_LIBERTAD = '#cad400';
  const VERDE_DARK = '#8a9100';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="info-panel animate-scale-in" style={{ width: '100%', maxWidth: '400px', padding: 0, border: 'none', background: 'var(--bg-card)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '2.5rem 2rem', background: `linear-gradient(135deg, ${VERDE_LIBERTAD} 0%, #b5be00 100%)`, color: '#1e293b', textAlign: 'center', position: 'relative' }}>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', 
              right: '1.25rem', 
              top: '1.25rem', 
              background: 'rgba(0,0,0,0.1)', 
              border: 'none', 
              color: '#1e293b', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
          >
            <HiOutlineX size={20} />
          </button>
          
          <div style={{ 
            width: '90px', 
            height: '90px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.4)', 
            border: `4px solid rgba(0,0,0,0.1)`, 
            margin: '0 auto 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '2.25rem', 
            fontWeight: 800,
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            color: '#1e293b'
          }}>
            {student.first_name[0]}{student.last_name[0]}
          </div>
          
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 700 }}>{student.first_name} {student.last_name}</h3>
          <div style={{ opacity: 0.8, fontSize: '0.95rem', marginTop: '6px', fontWeight: 600 }}>{student.program_name}</div>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(202, 212, 0, 0.1)', color: VERDE_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HiOutlinePhone size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Teléfono Móvil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{student.phone || 'No registrado'}</div>
                  {student.phone && (
                    <button 
                      onClick={() => handleCopy(student.phone, 'Teléfono')}
                      style={{ background: 'none', border: 'none', color: VERDE_DARK, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(202, 212, 0, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                      title="Copiar teléfono"
                    >
                      <HiOutlineDuplicate size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(202, 212, 0, 0.1)', color: VERDE_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HiOutlineMail size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Correo Electrónico</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{student.email || 'No registrado'}</div>
                  {student.email && (
                    <button 
                      onClick={() => handleCopy(student.email, 'Correo')}
                      style={{ background: 'none', border: 'none', color: VERDE_DARK, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(202, 212, 0, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                      title="Copiar correo"
                    >
                      <HiOutlineDuplicate size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button 
            className="btn" 
            style={{ 
              width: '100%', 
              marginTop: '2.5rem', 
              height: '48px',
              background: `linear-gradient(135deg, ${VERDE_LIBERTAD} 0%, #b5be00 100%)`,
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '12px',
              boxShadow: `0 10px 15px -3px rgba(202, 212, 0, 0.3)`,
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
