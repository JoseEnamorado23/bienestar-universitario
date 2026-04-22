import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineRefresh,
  HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineShieldCheck, HiOutlineX
} from 'react-icons/hi';

/* ── Action badge colours ──────────────────── */
const ACTION_META = {
  LOGIN:               { label: 'Login',           color: '#4facfe', bg: 'rgba(79,172,254,0.12)' },
  LOGOUT:              { label: 'Logout',           color: '#a0aec0', bg: 'rgba(160,174,192,0.12)' },
  CREATE_ADMIN:        { label: 'Crear Admin',      color: '#80ba27', bg: 'rgba(128,186,39,0.12)' },
  UPDATE_ADMIN:        { label: 'Editar Admin',     color: '#f093fb', bg: 'rgba(240,147,251,0.12)' },
  UPDATE_ADMIN_STATUS: { label: 'Estado Admin',     color: '#f093fb', bg: 'rgba(240,147,251,0.12)' },
  BLOCK_STUDENT:       { label: 'Bloquear Est.',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  UNBLOCK_STUDENT:     { label: 'Desbloquear Est.', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  ADD_MANUAL_HOURS:    { label: 'Horas Manual',     color: '#00acc9', bg: 'rgba(0,172,201,0.12)' },
  LOAN_CREATED:        { label: 'Préstamo Creado',  color: '#4facfe', bg: 'rgba(79,172,254,0.12)' },
  LOAN_APPROVED:       { label: 'Préstamo Aprobado',color: '#80ba27', bg: 'rgba(128,186,39,0.12)' },
  LOAN_RETURNED:       { label: 'Préstamo Devuelto',color: '#00acc9', bg: 'rgba(0,172,201,0.12)' },
  LOAN_REJECTED:       { label: 'Préstamo Rechazado',color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  ACTIVITY_CREATED:    { label: 'Actividad Creada', color: '#80ba27', bg: 'rgba(128,186,39,0.12)' },
  ACTIVITY_UPDATED:    { label: 'Actividad Editada', color: '#f093fb', bg: 'rgba(240,147,251,0.12)' },
  ACTIVITY_DELETED:    { label: 'Actividad Borrada', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  ACTIVITY_ATTENDANCE: { label: 'Asistencia Reg.', color: '#00acc9', bg: 'rgba(0,172,201,0.12)' },
  ITEM_CREATED:        { label: 'Implemento Creado',color: '#80ba27', bg: 'rgba(128,186,39,0.12)' },
  ITEM_UPDATED:        { label: 'Implemento Editado',color: '#f093fb', bg: 'rgba(240,147,251,0.12)' },
  ITEM_DELETED:        { label: 'Implemento Borrado',color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, color: '#a0aec0', bg: 'rgba(160,174,192,0.1)' };
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: '20px',
      color: meta.color, background: meta.bg, border: `1px solid ${meta.color}44`,
      whiteSpace: 'nowrap',
    }}>{meta.label}</span>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function AuditLog() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');
  const [actions, setActions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: page * limit,
        limit,
        ...(search      && { search }),
        ...(actionFilter && { action: actionFilter }),
        ...(dateFrom    && { date_from: new Date(dateFrom).toISOString() }),
        ...(dateTo      && { date_to: new Date(dateTo + 'T23:59:59').toISOString() }),
      });
      const { data } = await api.get(`/audit/logs?${params}`);
      setLogs(data.items);
      setTotal(data.total);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [page, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    api.get('/audit/actions').then(({ data }) => setActions(data)).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSearch(''); setActionFilter(''); setDateFrom(''); setDateTo(''); setPage(0);
  };

  return (
    <div className="animate-fade-in">
      <div className="info-panel" style={{ padding: '1.5rem', minHeight: 'calc(100vh - 160px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(79,172,254,0.1)', color: '#4facfe' }}>
              <HiOutlineShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Registros de Auditoría</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {total.toLocaleString()} eventos registrados en el sistema
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={fetchLogs}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <HiOutlineRefresh size={15} /> Actualizar
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1rem' }} />
            <input
              className="form-input"
              placeholder="Buscar por usuario o acción..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Action filter */}
          <select
            className="form-input"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(0); }}
            style={{ height: '36px', fontSize: '0.85rem', minWidth: '160px', cursor: 'pointer' }}
          >
            <option value="">Todas las acciones</option>
            {actions.map(a => (
              <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date" className="form-input" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            style={{ height: '36px', fontSize: '0.85rem', cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>→</span>
          <input
            type="date" className="form-input" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0); }}
            style={{ height: '36px', fontSize: '0.85rem', cursor: 'pointer' }}
          />

          {/* Clear */}
          {(search || actionFilter || dateFrom || dateTo) && (
            <button
              className="btn btn-ghost"
              onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px', padding: '0 10px', fontSize: '0.82rem', color: '#f87171' }}
            >
              <HiOutlineX size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="page-loading"><div className="page-loading-spinner" /></div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <HiOutlineShieldCheck size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p>No se encontraron registros con los filtros actuales.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <table className="responsive-table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha / Hora</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entidad</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IP</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', cursor: log.details ? 'pointer' : 'default' }}
                      onClick={() => log.details && setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td data-label="Fecha / Hora" style={{ padding: '10px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(log.created_at)}
                      </td>
                      <td data-label="Usuario" style={{ padding: '10px 8px' }}>
                        {log.user ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{log.user.first_name} {log.user.last_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sistema</span>
                        )}
                      </td>
                      <td data-label="Acción" style={{ padding: '10px 8px' }}><ActionBadge action={log.action} /></td>
                      <td data-label="Entidad" style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        {log.entity_type ? (
                          <span>
                            <span style={{ textTransform: 'capitalize' }}>{log.entity_type}</span>
                            {log.entity_id && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> #{log.entity_id}</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td data-label="IP" style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        {log.ip_address || '—'}
                      </td>
                      <td data-label="Detalles" style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {log.details ? (
                          <span style={{ color: '#4facfe', cursor: 'pointer' }}>
                            {expandedId === log.id ? '▲ ocultar' : '▼ ver'}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                    {expandedId === log.id && log.details && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6} style={{ padding: '0 8px 12px 8px' }}>
                          <div style={{ background: 'rgba(79,172,254,0.06)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)', borderLeft: '3px solid #4facfe44' }}>
                            {Object.entries(log.details).map(([k, v]) => (
                              <div key={k} style={{ marginBottom: '2px' }}>
                                <span style={{ color: '#4facfe', fontWeight: 600 }}>{k}:</span>{' '}
                                <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Mostrando {page * limit + 1}–{Math.min((page + 1) * limit, total)} de {total.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HiOutlineChevronLeft /> Anterior
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Siguiente <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
