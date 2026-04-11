import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import QRDisplay from '../../components/QRDisplay';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineQrcode,
  HiOutlineUsers, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineCalendar, HiOutlineX, HiOutlineRefresh, HiOutlineCheck,
  HiOutlineCheckCircle, HiOutlineExternalLink, HiOutlineDuplicate, HiOutlineDocumentReport
} from 'react-icons/hi';
import { hasPermission } from '../../utils/permissions';
import { PERMISSIONS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import ReportModal from '../../components/reports/ReportModal';

const STATUS_LABELS = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', FINISHED: 'Finalizada' };
const STATUS_COLORS = {
  DRAFT:     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  PUBLISHED: { bg: 'rgba(128,186,39,0.15)',  color: '#80ba27' },
  FINISHED:  { bg: 'rgba(0,0,0,0.1)',         color: '#64748b' },
};
const QR_LABELS = { STATIC: 'Estático', DYNAMIC: 'Dinámico', MANUAL: 'Manual' };
const QR_COLORS = {
  STATIC:  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  DYNAMIC: { bg: 'rgba(0,172,201,0.15)',   color: '#00acc9' },
  MANUAL:  { bg: 'rgba(128,186,39,0.15)', color: '#80ba27' },
};

function Badge({ label, style }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 600, ...style
    }}>{label}</span>
  );
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ActivityFormModal ha sido movido a su propia página ActivityForm.jsx

// ─────────────────────────────────────────
// Modal de QR
// ─────────────────────────────────────────
function QRModal({ activity, onClose, onToggleActive }) {
  const [qrData, setQrData] = useState({
    token: activity.qr_token,
    expires: activity.qr_token_expires_at,
  });
  const [toggling, setToggling] = useState(false);
  const intervalRef = useRef(null);

  const rotate = useCallback(async () => {
    try {
      const { data } = await api.post(`/activities/${activity.id}/rotate-qr`);
      setQrData({ token: data.qr_token, expires: data.qr_token_expires_at });
    } catch { /* silencioso */ }
  }, [activity.id]);

  useEffect(() => {
    if (activity.qr_type === 'DYNAMIC' && activity.is_active) {
      rotate(); // rotar de inmediato
      intervalRef.current = setInterval(rotate, 9000); // cada 9s
    }
    return () => clearInterval(intervalRef.current);
  }, [activity.qr_type, activity.is_active, rotate]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleActive(activity.id, !activity.is_active);
      onClose();
    } finally {
      setToggling(false);
    }
  };

  const qrColor = QR_COLORS[activity.qr_type] || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420, textAlign: 'center', background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Código QR — {activity.title}</h2>
          <button className="modal-close" onClick={onClose}><HiOutlineX /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Tipo y Acciones Rápidas */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
            <Badge
              label={`QR ${QR_LABELS[activity.qr_type]}`}
              style={{ background: qrColor.bg, color: qrColor.color }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => window.open(`/actividad-qr-publico/${activity.id}`, '_blank')}
                className="btn btn-ghost"
                title="Pantalla de Proyección"
                style={{ padding: '6px', minWidth: 0, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
              >
                <HiOutlineExternalLink size={18} />
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/actividad-qr-publico/${activity.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Vínculo copiado al portapapeles');
                }}
                className="btn btn-ghost"
                title="Copiar vínculo de proyección"
                style={{ padding: '6px', minWidth: 0, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
              >
                <HiOutlineDuplicate size={18} />
              </button>
              <button
                onClick={rotate}
                className="btn btn-ghost"
                title="Forzar Rotación"
                style={{ padding: '6px', minWidth: 0, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
              >
                <HiOutlineRefresh size={18} />
              </button>
            </div>
          </div>

          {/* QR visual */}
          {activity.is_active && qrData.token ? (
            <QRDisplay token={qrData.token} size={220} />
          ) : (
            <div style={{
              width: 252, height: 252, borderRadius: 12, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'var(--bg-glass)', border: '1px dashed var(--border-color)',
            }}>
              <HiOutlineX size={36} style={{ color: '#ef4444', opacity: 0.5 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>QR desactivado</span>
            </div>
          )}

          {/* Info dinámica */}
          {activity.qr_type === 'DYNAMIC' && activity.is_active && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,172,201,0.08)', color: 'var(--accent-primary)',
              padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            }}>
              <HiOutlineRefresh size={14} style={{ animation: 'spin 2s linear infinite' }} />
              Renovándose automáticamente cada 10 s
            </div>
          )}

          {/* Expiración estático */}
          {activity.qr_type === 'STATIC' && qrData.expires && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Expira: <strong>{formatDateTime(qrData.expires)}</strong>
            </p>
          )}

          {/* Asistencias */}
          <div style={{
            width: '100%', background: 'var(--bg-glass)', borderRadius: 10,
            padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Asistencias registradas</span>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{activity.attendance_count ?? 0}</strong>
          </div>


          {/* Activar / Desactivar */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="btn"
            style={{
              width: '100%',
              background: activity.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(128,186,39,0.1)',
              color: activity.is_active ? '#ef4444' : '#80ba27',
              border: `1px solid ${activity.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(128,186,39,0.3)'}`,
            }}>
            {toggling ? 'Procesando…' : activity.is_active ? '🔴 Desactivar QR' : '🟢 Activar QR'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Modal de Asistencias
// ─────────────────────────────────────────
function AttendancesModal({ activity, onClose }) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/activities/${activity.id}/attendances`)
      .then(({ data }) => setAttendances(data))
      .catch(() => toast.error('Error al cargar asistencias.'))
      .finally(() => setLoading(false));
  }, [activity.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = {
        type: 'activities',
        format: 'pdf',
        fields: 'first_name,last_name,national_id,program_name,hours_earned,scanned_at',
        activity_id: activity.id
      };

      const response = await api.get('/reports/download', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${activity.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte descargado exitosamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 600, background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Asistencias — {activity.title}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {attendances.length > 0 && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.8rem', height: 'auto', background: '#ef4444' }}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }}></span> : <HiOutlineDocumentReport size={16} />}
                <span>PDF</span>
              </button>
            )}
            <button className="modal-close" onClick={onClose} style={{ position: 'relative', top: 0, right: 0 }}><HiOutlineX /></button>
          </div>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : attendances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
              <HiOutlineUsers size={36} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              Aún no hay asistencias registradas.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Estudiante</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Horas</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Escaneado</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map(att => (
                    <tr key={att.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Estudiante" style={{ padding: '8px 12px' }}>
                        {att.student
                          ? `${att.student.first_name} ${att.student.last_name}`
                          : `Est. #${att.student_id}`}
                      </td>
                      <td data-label="Horas" style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 700 }}>+{att.hours_earned}h</td>
                      <td data-label="Escaneado" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDateTime(att.scanned_at)}
                      </td>
                      <td data-label="Ubicación" style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {att.scan_latitude != null
                          ? `${att.scan_latitude.toFixed(4)}, ${att.scan_longitude.toFixed(4)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Tarjeta de Actividad
// ─────────────────────────────────────────
function ActivityCard({ activity, onEdit, onQR, onAttendances, onDelete }) {
  const stCfg = STATUS_COLORS[activity.status] || { bg: 'var(--bg-glass)', color: 'var(--text-secondary)' };
  const qrCfg = QR_COLORS[activity.qr_type] || {};

  return (
    <div className="info-panel" style={{
      padding: 0, overflow: 'hidden',
      transition: 'transform 0.15s, box-shadow 0.15s',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Imagen o gradiente */}
      <div style={{
        height: 120, background: activity.image_url
          ? `url(http://localhost:8000${activity.image_url}) center/cover`
          : 'linear-gradient(135deg, rgba(0,172,201,0.15), rgba(128,186,39,0.15))',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <Badge label={STATUS_LABELS[activity.status] || activity.status} style={{ background: stCfg.bg, color: stCfg.color }} />
          <Badge label={QR_LABELS[activity.qr_type]} style={{ background: qrCfg.bg, color: qrCfg.color }} />
        </div>
        {activity.require_location && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
            <HiOutlineLocationMarker size={12} /> GPS
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activity.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          {activity.event_datetime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineCalendar size={13} /> {formatDateTime(activity.event_datetime)}
            </span>
          )}
          {activity.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineLocationMarker size={13} /> {activity.location}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HiOutlineClock size={13} /> {activity.hours_reward}h sociales
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HiOutlineUsers size={13} /> {activity.attendance_count ?? 0} asistencias
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={() => onQR(activity)}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.78rem', flex: 1, minWidth: 60 }}
          >
            <HiOutlineQrcode size={15} /> QR
          </button>
          <button
            onClick={() => onAttendances(activity)}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.78rem', flex: 1, minWidth: 80 }}
          >
            <HiOutlineUsers size={15} /> Asistentes
          </button>
          <button
            onClick={() => onEdit(activity)}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="Editar"
          >
            <HiOutlinePencil size={15} />
          </button>
          <button
            onClick={() => onDelete(activity)}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
            title="Eliminar"
          >
            <HiOutlineTrash size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────
export default function ActivityManagement() {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [qrTarget, setQrTarget] = useState(null);
  const [attendTarget, setAttendTarget] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (setHeaderContent) setHeaderContent({
      title: 'Gestión de Actividades',
      subtitle: 'Crea y administra actividades con QR para asistencia de estudiantes.',
    });
  }, [setHeaderContent]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/activities/${params}`);
      // Enriquecer con attendance_count desde el endpoint admin cuando sea posible
      const enriched = await Promise.all(
        data.map(async act => {
          try {
            const { data: adm } = await api.get(`/activities/${act.id}/admin`);
            return { ...act, attendance_count: adm.attendance_count, qr_token: adm.qr_token, qr_token_expires_at: adm.qr_token_expires_at };
          } catch {
            return act;
          }
        })
      );
      setActivities(enriched);
    } catch (err) {
      toast.error('Error al cargar las actividades.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleToggleActive = async (id, newState) => {
    try {
      await api.put(`/activities/${id}`, { is_active: newState });
      toast.success(newState ? 'QR activado.' : 'QR desactivado.');
      fetchActivities();
    } catch { toast.error('Error al cambiar el estado del QR.'); }
  };

  const handleDelete = async (act) => {
    if (!window.confirm(`¿Finalizar la actividad "${act.title}"? No se aceptarán más escaneos.`)) return;
    try {
      await api.delete(`/activities/${act.id}`);
      toast.success('Actividad finalizada.');
      setActivities(prev => prev.filter(a => a.id !== act.id));
    } catch { toast.error('Error al eliminar la actividad.'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Actividades</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
            <select
              className="form-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 160, height: '36px', padding: '0 8px', fontSize: '0.85rem', marginBottom: 0 }}
            >
              <option value="">Todas</option>
              <option value="DRAFT">Borradores</option>
              <option value="PUBLISHED">Publicadas</option>
              <option value="FINISHED">Finalizadas</option>
            </select>
            {user && hasPermission(user.permissions, PERMISSIONS.REPORT_ACTIVITIES) && (
              <button 
                className="btn btn-primary" 
                style={{ width: 'auto', height: '36px', padding: '0 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowReportModal(true)}
              >
                <HiOutlineDocumentReport size={16} /> Reporte
              </button>
            )}
            <button 
              className="btn btn-primary" 
              style={{ width: 'auto', height: '36px', padding: '0 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
              onClick={() => navigate('nueva')}
            >
              <HiOutlinePlus size={16} /> Nueva
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="page-loading"><div className="page-loading-spinner" /></div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <HiOutlineCalendar size={40} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No hay actividades{filterStatus ? ' con ese estado' : ''}. ¡Crea la primera!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
            {activities.map(act => (
              <ActivityCard
                key={act.id}
                activity={act}
                onEdit={a => navigate(`editar/${a.id}`)}
                onQR={a => setQrTarget(a)}
                onAttendances={a => setAttendTarget(a)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {qrTarget && (
        <QRModal
          activity={qrTarget}
          onClose={() => { setQrTarget(null); fetchActivities(); }}
          onToggleActive={handleToggleActive}
        />
      )}
      {attendTarget && (
        <AttendancesModal
          activity={attendTarget}
          onClose={() => setAttendTarget(null)}
        />
      )}
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} type="activities" />
    </div>
  );
}
