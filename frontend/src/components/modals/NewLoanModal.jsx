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

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1100 }}
    >
      <div 
        className="modal-content animate-scale" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: 'var(--bg-card)', 
          padding: 0, 
          borderRadius: '24px', 
          width: '90%', 
          maxWidth: '550px', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: 'none'
        }}
      >
        <div style={{ 
          padding: '2.5rem 2rem', 
          background: 'linear-gradient(135deg, #00acc9 0%, #008fa6 100%)', 
          color: 'white', 
          textAlign: 'center', 
          position: 'relative' 
        }}>
          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute', 
              right: '1.25rem', 
              top: '1.25rem', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <HiOutlineX size={20} />
          </button>
          
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'rgba(255,255,255,0.2)', 
            margin: '0 auto 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
          }}>
            <HiOutlineClipboardList size={32} />
          </div>
          
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Generar Nuevo Préstamo</h3>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '8px' }}>Asigna un implemento directamente a un estudiante verificado.</p>
        </div>

        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Implemento a prestar
              </label>
              <select 
                className="form-input" 
                value={formData.item_id} 
                onChange={e => setFormData({...formData, item_id: e.target.value})}
                required
                style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '12px' }}
              >
                <option value="">-- Seleccione un implemento --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.available_quantity} disp.)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Cédula del Estudiante
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineIdentification size={24} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'var(--text-secondary)' }}/>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '50px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', fontSize: '1rem', borderRadius: '12px' }}
                  value={formData.student_document} 
                  onChange={e => setFormData({ ...formData, student_document: e.target.value })} 
                  required 
                  placeholder="Ingrese número de documento"
                />
              </div>
            </div>

            <div style={{ 
              marginBottom: '2rem', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              background: !studentPreview ? 'var(--bg-glass)' : (studentPreview.status === 'INACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(128, 186, 39, 0.08)'),
              border: `1px solid ${!studentPreview ? 'var(--border-color)' : (studentPreview.status === 'INACTIVE' ? '#ef4444' : '#80ba27')}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.3s ease'
            }}>
               {searching ? (
                  <div className="spinner" style={{ width: '24px', height: '24px', borderTopColor: '#00acc9' }}></div>
               ) : studentPreview ? (
                  <>
                    {studentPreview.status === 'INACTIVE' ? (
                      <>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef444422', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOutlineX size={24} color="#ef4444" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bloqueado</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{studentPreview.name}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#80ba2722', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <HiOutlineCheckCircle size={24} color="#80ba27" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#80ba27', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verificado</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{studentPreview.name}</div>
                        </div>
                      </>
                    )}
                  </>
               ) : (
                  <>
                    <HiOutlineSearch size={24} color="var(--text-muted)" />
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Complete el documento para validar
                    </div>
                  </>
               )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
                className="btn" 
                disabled={loading || !studentPreview || studentPreview.status === 'INACTIVE'}
                style={{ 
                  flex: 2, 
                  height: '48px', 
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00acc9 0%, #008fa6 100%)',
                  color: 'white',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: (loading || !studentPreview || studentPreview.status === 'INACTIVE') ? 'not-allowed' : 'pointer',
                  opacity: (loading || !studentPreview || studentPreview.status === 'INACTIVE') ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(0, 172, 201, 0.2)'
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
