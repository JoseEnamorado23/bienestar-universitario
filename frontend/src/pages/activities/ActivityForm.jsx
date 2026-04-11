import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineChevronLeft, HiOutlineSave, HiOutlineTrash,
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineClock,
  HiOutlinePhotograph, HiOutlineInformationCircle, HiOutlineUpload, HiX,
} from 'react-icons/hi';

const QR_LABELS = { MANUAL: 'Manual', STATIC: 'Estático', DYNAMIC: 'Dinámico' };
const QR_COLORS = {
  MANUAL:  { bg: 'rgba(128,186,39,0.15)', color: '#80ba27' },
  STATIC:  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  DYNAMIC: { bg: 'rgba(0,172,201,0.15)',   color: '#00acc9' },
};

export default function ActivityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setHeaderContent } = useOutletContext();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    event_datetime: '',
    hours_reward: 1,
    qr_type: 'MANUAL',
    qr_static_expiry: '',
    require_location: false,
    image_url: '',
    status: 'DRAFT',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setHeaderContent({
      title: isEdit ? 'Editar Actividad' : 'Nueva Actividad',
      subtitle: isEdit ? 'Actualiza los detalles de la actividad seleccionada.' : 'Crea una nueva actividad para los estudiantes.',
    });
  }, [setHeaderContent, isEdit]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/activities/${id}/admin`)
        .then(({ data }) => {
          setForm({
            ...data,
            event_datetime: data.event_datetime ? data.event_datetime.slice(0, 16) : '',
            qr_static_expiry: data.qr_token_expires_at ? data.qr_token_expires_at.slice(0, 16) : '',
          });
          if (data.image_url) {
            setPreviewUrl(`http://localhost:8000${data.image_url}`);
          }
        })
        .catch(() => {
          toast.error('No se pudo cargar la actividad.');
          navigate('/dashboard/actividades');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalImageUrl = form.image_url;

      // 1. Subir imagen si hay una nueva
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        const uploadRes = await api.post('/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      const payload = {
        ...form,
        hours_reward: parseFloat(form.hours_reward) || 1,
        event_datetime: form.event_datetime || null,
        qr_static_expiry: form.qr_type === 'STATIC' && form.qr_static_expiry ? form.qr_static_expiry : null,
        image_url: finalImageUrl || null,
      };

      if (isEdit) {
        await api.put(`/activities/${id}`, payload);
        toast.success('Actividad actualizada.');
      } else {
        await api.post('/activities/', payload);
        toast.success('Actividad creada exitosamente.');
      }
      navigate('/dashboard/actividades');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no válido. Usa JPG, PNG o WEBP.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar definitivamente esta actividad?')) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Actividad eliminada.');
      navigate('/dashboard/actividades');
    } catch {
      toast.error('No se pudo eliminar la actividad.');
    }
  };

  if (loading) return <div className="page-loading"><div className="page-loading-spinner" /></div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={() => navigate('/dashboard/actividades')} className="btn btn-ghost" style={{ width: 'auto' }}>
          <HiOutlineChevronLeft size={18} /> Volver al listado
        </button>
        {isEdit && (
          <button onClick={handleDelete} className="btn btn-ghost" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', width: 'auto' }}>
            <HiOutlineTrash size={18} /> Eliminar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="info-panel" style={{ padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Título Principal */}
          <div className="form-group">
            <label className="form-label">TÍTULO DE LA ACTIVIDAD *</label>
            <input 
              className="form-input" 
              required 
              value={form.title}
              onChange={e => set('title', e.target.value)} 
              placeholder="Ej: Caminata Ecológica - Campus Norte" 
              style={{ fontSize: '1.2rem', fontWeight: 600, padding: '16px' }}
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">DESCRIPCIÓN</label>
            <textarea 
              className="form-input" 
              rows={4} 
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Detalla de qué trata la actividad, beneficios, requisitos..."
              style={{ resize: 'vertical' }} 
            />
          </div>

          <div className="responsive-grid-2" style={{ gap: 24 }}>
            <div className="form-group">
              <label className="form-label"><HiOutlineLocationMarker size={14} /> LUGAR / PUNTO DE ENCUENTRO</label>
              <input className="form-input" value={form.location}
                onChange={e => set('location', e.target.value)} placeholder="Ej: Portería Principal" />
            </div>
            <div className="form-group">
              <label className="form-label"><HiOutlineCalendar size={14} /> FECHA Y HORA DEL EVENTO</label>
              <input className="form-input" type="datetime-local" value={form.event_datetime}
                onChange={e => set('event_datetime', e.target.value)} />
            </div>
          </div>

          <div className="responsive-grid-2" style={{ gap: 24 }}>
            <div className="form-group">
              <label className="form-label"><HiOutlineClock size={14} /> HORAS A OTORGAR</label>
              <input className="form-input" type="number" min={0.5} max={40} step={0.5}
                value={form.hours_reward} onChange={e => set('hours_reward', e.target.value)} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Estas horas se sumarán automáticamente al perfil del estudiante.
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">ESTADO DE PUBLICACIÓN</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="DRAFT">Borrador (No visible)</option>
                <option value="PUBLISHED">Publicada (Visible para todos)</option>
                <option value="FINISHED">Finalizada (Ya no permite asistencia)</option>
              </select>
            </div>
          </div>

          {/* Tipo de QR - Layout más visual */}
          <div className="form-group" style={{ background: 'var(--bg-glass)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <label className="form-label" style={{ marginBottom: 16 }}>CONFIGURACIÓN DEL CÓDIGO QR</label>
            <div className="responsive-grid-3" style={{ gap: 12 }}>
              {Object.keys(QR_LABELS).map(type => (
                <button 
                  key={type} 
                  type="button"
                  onClick={() => set('qr_type', type)}
                  style={{
                    padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s',
                    border: form.qr_type === type ? `2px solid ${QR_COLORS[type].color}` : '1px solid var(--border-color)',
                    background: form.qr_type === type ? QR_COLORS[type].bg : 'var(--bg-glass)',
                    color: form.qr_type === type ? QR_COLORS[type].color : 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  }}>
                  {QR_LABELS[type]}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <HiOutlineInformationCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                {form.qr_type === 'MANUAL' && 'Control total: Tú activas y desactivas el QR cuando quieras.'}
                {form.qr_type === 'STATIC' && 'Seguro: El QR dejará de funcionar automáticamente en el momento que indiques.'}
                {form.qr_type === 'DYNAMIC' && 'Anticopia: El código cambia cada 10 segundos, impidiendo que se tomen fotos y se compartan.'}
              </span>
            </div>
          </div>

          {form.qr_type === 'STATIC' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">EL QR EXPIRARÁ EL:</label>
              <input className="form-input" type="datetime-local" value={form.qr_static_expiry}
                onChange={e => set('qr_static_expiry', e.target.value)} />
            </div>
          )}

          {/* Requerir ubicación con toggle grande */}
          <div className="form-group" style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'var(--bg-glass)', padding: '16px 20px', borderRadius: 12 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Validación por Ubicación (GPS)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Solo permitir escaneos dentro del radio autorizado de la universidad.
              </span>
            </div>
            <div
              onClick={() => set('require_location', !form.require_location)}
              style={{
                width: 52, height: 28, borderRadius: 14, position: 'relative', cursor: 'pointer',
                background: form.require_location ? 'var(--accent-primary)' : 'rgba(0,0,0,0.1)',
                transition: 'background 0.3s ease',
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: form.require_location ? 27 : 3,
                transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {/* Imagen de Portada */}
          <div className="form-group">
            <label className="form-label"><HiOutlinePhotograph size={14} /> IMAGEN DE PORTADA</label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg, image/png, image/webp" 
              style={{ display: 'none' }} 
            />

            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)', borderRadius: 12, padding: 40,
                  textAlign: 'center', cursor: 'pointer', background: 'var(--bg-glass)',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <HiOutlineUpload size={32} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Haz clic para cargar imagen</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soporta JPG, PNG, WEBP (Máx 5MB)</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 240, objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  display: 'flex', alignItems: 'flex-end', padding: 16
                }}>
                  <button 
                    type="button"
                    onClick={() => { setPreviewUrl(''); setSelectedFile(null); set('image_url', ''); }}
                    className="btn btn-ghost"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', width: 'auto' }}
                  >
                    <HiX size={16} /> Cambiar Imagen
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/actividades')} style={{ width: 'auto' }}>
              Descartar
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 40px' }} disabled={saving}>
              {saving ? 'Guardando...' : <><HiOutlineSave size={18} /> {isEdit ? 'Guardar Cambios' : 'Crear Actividad'}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
