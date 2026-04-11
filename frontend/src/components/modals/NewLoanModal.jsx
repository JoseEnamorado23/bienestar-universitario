import { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineIdentification, HiOutlineCheckCircle, HiOutlineClipboardList, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function NewLoanModal({ isOpen, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ item_id: '', student_document: '' });
  const [studentPreview, setStudentPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load items when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get('/inventory/?status=ACTIVE').then(res => {
        setItems(res.data.filter(i => i.available_quantity > 0));
      }).catch(err => {
        toast.error('Error al cargar inventario');
      });
      // Reset form
      setFormData({ item_id: '', student_document: '' });
      setStudentPreview(null);
    }
  }, [isOpen]);

  // Search student
  useEffect(() => {
    const searchStudent = async () => {
      const doc = formData.student_document.trim();
      if (doc.length >= 5) {
        setSearching(true);
        try {
          const res = await api.get(`/admin/students?search=${doc}`);
          const students = res.data.items || [];
          const match = students.find(s => s.national_id === doc);
          
          if (match) {
            setStudentPreview({
              name: `${match.first_name} ${match.last_name}`,
              status: match.status,
              reason: match.block_reason
            });
          } else {
            setStudentPreview(null);
          }
        } catch (e) {
          setStudentPreview(null);
        } finally {
          setSearching(false);
        }
      } else {
        setStudentPreview(null);
      }
    };
    
    if (isOpen) {
      const timeout = setTimeout(searchStudent, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData.student_document, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentPreview || studentPreview.status === 'INACTIVE') {
      toast.error('No se puede crear préstamo para un estudiante bloqueado');
      return;
    }
    setLoading(true);
    try {
      await api.post('/loans/direct', {
        item_id: Number(formData.item_id),
        student_document: formData.student_document
      });
      toast.success('Préstamo creado con éxito');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear préstamo');
    } finally {
      setLoading(false);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet-content">
        <div className="bottom-sheet-handle" />

        <div className="modal-header" style={{ padding: '2rem 1.75rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: 'none' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            background: 'var(--primary-color)10',
            padding: '12px 28px',
            borderRadius: '99px',
            color: 'var(--primary-color)',
            boxShadow: '0 4px 12px rgba(0, 172, 201, 0.1)'
          }}>
            <HiOutlineClipboardList size={28} />
            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 700 }}>Nuevo Préstamo</h3>
          </div>
        </div>

        <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Implemento a prestar
              </label>
              <select 
                className="form-input" 
                value={formData.item_id} 
                onChange={e => setFormData({...formData, item_id: e.target.value})}
                required
                style={{ width: '100%', height: '48px', borderRadius: '12px' }}
              >
                <option value="">-- Seleccione un implemento --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.available_quantity} disp.)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Documento del Estudiante
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineIdentification size={22} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'var(--text-secondary)' }}/>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '48px', height: '48px', borderRadius: '12px' }}
                  value={formData.student_document} 
                  onChange={e => setFormData({ ...formData, student_document: e.target.value })} 
                  required 
                  placeholder="Número de documento"
                />
              </div>
            </div>

            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              borderRadius: '16px', 
              background: !studentPreview ? 'var(--bg-glass)' : (studentPreview.status === 'INACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(128, 186, 39, 0.08)'),
              border: `1px solid ${!studentPreview ? 'var(--border-color)' : (studentPreview.status === 'INACTIVE' ? '#ef444466' : '#80ba2766')}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease'
            }}>
               {searching ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--primary-color)' }}></div>
               ) : studentPreview ? (
                  <>
                    {studentPreview.status === 'INACTIVE' ? (
                      <>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ef444422', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOutlineX size={18} color="#ef4444" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Bloqueado</div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{studentPreview.name}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#80ba2722', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOutlineCheckCircle size={18} color="#80ba27" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#80ba27', fontWeight: 700, textTransform: 'uppercase' }}>Verificado</div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{studentPreview.name}</div>
                        </div>
                      </>
                    )}
                  </>
               ) : (
                  <>
                    <HiOutlineSearch size={20} color="var(--text-muted)" />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Ingresa el documento para validar
                    </div>
                  </>
               )}
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: '0.75rem', 
              marginTop: '1.5rem' 
            }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={onClose} 
                disabled={loading}
                style={{ flex: 1, height: '48px', borderRadius: '12px' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !studentPreview || studentPreview.status === 'INACTIVE'}
                style={{ 
                  flex: isMobile ? 1 : 1.5, 
                  height: '48px', 
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? <div className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderTopColor: 'white' }}></div> : (
                  <>
                    <HiOutlineCheckCircle size={20} />
                    Confirmar Préstamo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
