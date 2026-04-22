import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineClock, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';

const STATUS_CONFIG = {
  SOLICITADO: { label: 'Solicitado', bg: 'rgba(240, 147, 251, 0.15)', color: '#f093fb' },
  ACTIVO:     { label: 'Activo',     bg: 'rgba(0, 172, 201, 0.15)',   color: 'var(--primary-color)' },
  VENCIDO:    { label: 'Vencido',    bg: 'rgba(239, 68, 68, 0.15)',   color: '#ef4444' },
  DEVUELTO:   { label: 'Devuelto',   bg: 'rgba(128, 186, 39, 0.15)', color: 'var(--success)' },
  RECHAZADO:  { label: 'Rechazado', bg: 'rgba(239, 68, 68, 0.15)',   color: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'rgba(255,255,255,0.1)', color: 'inherit' };
  return (
    <span style={{ padding: '4px 12px', borderRadius: '20px', background: cfg.bg, color: cfg.color, fontSize: '0.78rem', fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function StudentLoans() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Mis Préstamos',
        subtitle: 'Consulta el estado de tus solicitudes y el historial de préstamos realizados.'
      });
    }
  }, [setHeaderContent]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans/my-loans');
      setLoans(data);
    } catch (err) {
      toast.error('Error al cargar tus préstamos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const activeLoans = loans.filter(l => ['SOLICITADO', 'ACTIVO', 'VENCIDO'].includes(l.status));
  const historyLoans = loans.filter(l => ['DEVUELTO', 'RECHAZADO'].includes(l.status));

  if (loading) {
    return <div className="page-loading"><div className="page-loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar-title" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1>Mis Préstamos</h1>
        <p>Consulta el estado de tus solicitudes y el historial de préstamos realizados</p>
      </div>

      {/* Active / Pending loans */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Solicitudes y Préstamos Activos
      </h3>
      {activeLoans.length === 0 ? (
        <div className="info-panel" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '2rem' }}>
          <HiOutlineClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No tienes préstamos activos en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {activeLoans.map(loan => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}

      {/* History */}
      {historyLoans.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Historial
          </h3>
          <div className="info-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Implemento</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inicio</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Devolución</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horas ganadas</th>
                </tr>
              </thead>
              <tbody>
                {historyLoans.map(loan => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td data-label="Implemento" style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{loan.item?.name || '-'}</td>
                    <td data-label="Estado" style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge status={loan.status} />
                      {loan.status === 'RECHAZADO' && loan.rejection_reason && (
                        <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' }}>
                          Motivo: {loan.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td data-label="Inicio" style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{formatDate(loan.start_time)}</td>
                    <td data-label="Devolución" style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{formatDate(loan.returned_time)}</td>
                    <td data-label="Horas ganadas" style={{ padding: '0.85rem 1rem', fontWeight: 600, color: loan.hours_earned > 0 ? 'var(--success)' : 'inherit' }}>
                      {loan.hours_earned > 0 ? `+${loan.formatted_hours_earned || loan.hours_earned + 'h'}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LoanCard({ loan }) {
  const cfg = STATUS_CONFIG[loan.status] || {};
  const isOverdue = loan.status === 'VENCIDO';

  return (
    <div className="info-panel" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1.25rem 1.5rem',
      border: isOverdue ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)',
      flexWrap: 'wrap'
    }}>
      {/* Item image / icon */}
      <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {loan.item?.image_url
          ? <img src={`http://${window.location.hostname}:8000${loan.item.image_url}`} alt={loan.item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <HiOutlineClipboardList size={28} style={{ opacity: 0.4 }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{loan.item?.name || '-'}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {loan.start_time && <span><HiOutlineClock style={{ verticalAlign: 'middle', marginRight: 4 }} />Inicio: {new Date(loan.start_time).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          {loan.expected_return_time && loan.status !== 'DEVUELTO' && (
            <span style={{ color: isOverdue ? '#ef4444' : 'inherit' }}>
              Límite: {new Date(loan.expected_return_time).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {loan.status === 'SOLICITADO' && (
          <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(240,147,251,0.08)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
            ⏳ Esperando aprobación de un administrador.
          </div>
        )}
        {isOverdue && (
          <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
            ⚠️ Este préstamo está vencido. Por favor devuelve el implemento.
          </div>
        )}
      </div>

      <StatusBadge status={loan.status} />
    </div>
  );
}
