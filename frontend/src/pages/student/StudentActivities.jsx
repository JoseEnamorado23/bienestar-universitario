import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import QRScanner from '../../components/QRScanner';
import {
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineClock,
  HiOutlineQrcode, HiOutlineCheckCircle, HiOutlineX,
} from 'react-icons/hi';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActivityCard({ activity, onScan, alreadyAttended }) {
  return (
    <div className="info-panel" style={{
      padding: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity: activity.status === 'FINISHED' ? 0.65 : 1,
    }}>
      {/* imagen / gradiente */}
      <div style={{
        height: 110,
        background: activity.image_url
          ? `url(http://${window.location.hostname}:8000${activity.image_url}) center/cover`
          : 'linear-gradient(135deg, rgba(0,172,201,0.15), rgba(128,186,39,0.15))',
        position: 'relative',
      }}>
        {alreadyAttended && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(128,186,39,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: '#80ba27', borderRadius: '50%', padding: 8 }}>
              <HiOutlineCheckCircle size={24} color="#fff" />
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '3px 10px',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <HiOutlineClock size={13} /> +{activity.hours_reward}h
        </div>
      </div>

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 6, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activity.title}
        </h3>
        {activity.description && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {activity.description}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.77rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {activity.event_datetime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineCalendar size={12} /> {formatDateTime(activity.event_datetime)}
            </span>
          )}
          {activity.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineLocationMarker size={12} /> {activity.location}
            </span>
          )}
          {activity.require_location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
              📍 Requiere estar en el campus
            </span>
          )}
        </div>

        {alreadyAttended ? (
          <div style={{
            textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
            color: '#80ba27', background: 'rgba(128,186,39,0.1)',
            borderRadius: 8, padding: '6px 0',
          }}>
            ✅ Ya registraste tu asistencia
          </div>
        ) : activity.status === 'PUBLISHED' && activity.is_active ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.82rem', padding: '8px 0' }}
            onClick={() => onScan(activity)}
          >
            <HiOutlineQrcode size={16} /> Registrar asistencia
          </button>
        ) : (
          <div style={{
            textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)',
            background: 'var(--bg-glass)', borderRadius: 8, padding: '6px 0',
          }}>
            {activity.status === 'FINISHED' ? 'Actividad finalizada' : 'No disponible'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentActivities() {
  const { setHeaderContent } = useOutletContext();
  const [tab, setTab] = useState('upcoming');
  const [activities, setActivities] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingAct, setLoadingAct] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [scanTarget, setScanTarget] = useState(null); // actividad que estamos escaneando

  useEffect(() => {
    if (setHeaderContent) setHeaderContent({
      title: 'Actividades',
      subtitle: 'Explora las actividades disponibles y registra tu asistencia escaneando el QR.',
    });
  }, [setHeaderContent]);

  const fetchActivities = async () => {
    setLoadingAct(true);
    try {
      const { data } = await api.get('/activities/?status=PUBLISHED');
      setActivities(data);
    } catch { toast.error('Error al cargar actividades.'); }
    finally { setLoadingAct(false); }
  };

  const fetchHistory = async () => {
    setLoadingHist(true);
    try {
      const { data } = await api.get('/activities/my-activities/history');
      setHistory(data);
    } catch { /* silencioso */ }
    finally { setLoadingHist(false); }
  };

  useEffect(() => {
    fetchActivities();
    fetchHistory();
  }, []);

  const attendedIds = new Set(history.map(h => h.activity_id));

  const handleScanSuccess = () => {
    setScanTarget(null);
    fetchHistory();
    fetchActivities();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar-title" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1>Actividades</h1>
        <p>Explora las actividades disponibles y registra tu asistencia escaneando el QR</p>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-color)' }}>
        {[
          { key: 'upcoming', label: 'Actividades disponibles' },
          { key: 'history', label: 'Mis actividades' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 0, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.88rem', background: 'none',
              color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            {t.key === 'history' && history.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--accent-primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem' }}>
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'upcoming' && (
        <>
          {loadingAct ? (
            <div className="page-loading"><div className="page-loading-spinner" /></div>
          ) : activities.length === 0 ? (
            <div className="info-panel" style={{ textAlign: 'center', padding: 48 }}>
              <HiOutlineCalendar size={40} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No hay actividades disponibles en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {activities.map(act => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  alreadyAttended={attendedIds.has(act.id)}
                  onScan={a => setScanTarget(a)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {loadingHist ? (
            <div className="page-loading"><div className="page-loading-spinner" /></div>
          ) : history.length === 0 ? (
            <div className="info-panel" style={{ textAlign: 'center', padding: 48 }}>
              <HiOutlineCheckCircle size={40} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Aún no has participado en ninguna actividad.</p>
            </div>
          ) : (
            <div className="info-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actividad</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horas</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(att => (
                    <tr key={att.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Actividad" style={{ padding: '10px 16px', fontWeight: 500 }}>
                        Actividad #{att.activity_id}
                      </td>
                      <td data-label="Horas" style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--success)' }}>
                        +{att.hours_earned}h
                      </td>
                      <td data-label="Fecha" style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {formatDateTime(att.scanned_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </>
      )}

      {/* Modal de escáner QR */}
      {scanTarget && (
        <div className="modal-overlay" onClick={() => setScanTarget(null)}>
          <div className="modal-content" style={{ maxWidth: 440, background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontWeight: 600 }}>{scanTarget.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ganas <strong style={{ color: 'var(--success)' }}>+{scanTarget.hours_reward}h sociales</strong> al asistir.
                </p>
              </div>
              <QRScanner
                onSuccess={handleScanSuccess}
                onClose={() => setScanTarget(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
