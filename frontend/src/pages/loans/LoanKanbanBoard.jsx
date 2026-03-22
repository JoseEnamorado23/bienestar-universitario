import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineRefresh, 
  HiOutlineExclamationCircle, HiOutlineX, HiOutlinePhone,
  HiOutlineMail, HiOutlineDuplicate
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/* ─── Contact Modal ────────────────────────────────────────── */
function ContactModal({ open, onClose, student }) {
  if (!open || !student) return null;

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado`, {
      id: 'copy-toast',
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
                      style={{ background: 'none', border: 'none', color: VERDE_DARK, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
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
                      style={{ background: 'none', border: 'none', color: VERDE_DARK, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
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

export default function LoanKanbanBoard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingLoan, setRejectingLoan] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [contactModal, setContactModal] = useState({ open: false, student: null });
  const { setHeaderContent } = useOutletContext();

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Tablero Kanban',
        subtitle: 'Vista rápida de préstamos diseñada como un tablero de notas adhesivas.'
      });
    }
  }, [setHeaderContent]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans/', { params: { limit: 1000 } });
      setLoans(data.items || []);
    } catch (error) {
      toast.error('Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();

    // Establish WebSocket connection for real-time updates
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
            console.log('Real-time update received:', data);
            fetchLoans();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/loans/${id}/approve`);
      toast.success('Préstamo aprobado');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al aprobar');
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('¿Confirmar devolución e imputar horas sociales?')) return;
    try {
      const res = await api.put(`/loans/${id}/return`);
      toast.success(`Devuelto! Horas ganadas: ${res.data.formatted_hours_earned || res.data.hours_earned}`);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al devolver');
    }
  };

  const openRejectModal = (loan) => {
    setRejectingLoan(loan);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectingLoan(null);
    setRejectionReason('');
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, ingresa el motivo del rechazo.');
      return;
    }
    try {
      await api.put(`/loans/${rejectingLoan.id}/reject`, { reason: rejectionReason.trim() });
      toast.success('Préstamo rechazado.');
      closeRejectModal();
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al rechazar');
    }
  };

  const requested = loans.filter(l => l.status === 'SOLICITADO');
  const active = loans.filter(l => l.status === 'ACTIVO');
  const overdue = loans.filter(l => l.status === 'VENCIDO');

  const formatDate = (dateString, showTimeInfo = true) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-CO', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getRotation = (id) => {
    // Generar un ángulo pseudoaleatorio entre -3 y 3 grados basado en el ID
    const hash = String(id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return (hash % 7) - 3;
  };

  const LoanCard = ({ loan, type }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isOverdue = type === 'VENCIDO';
    const isRequested = type === 'SOLICITADO';
    
    // Colores pastel inspirados en post-its (como en la imagen de referencia)
    // Colores institucionales con tonalidades
    let bgColor = '#fff';
    let borderColor = '#ddd';
    let accentColor = '#666';

    if (type === 'SOLICITADO') {
      bgColor = '#f0f9fb'; // Muy claro Azul Diversidad
      borderColor = '#00acc933';
      accentColor = '#00acc9'; // Azul Diversidad
    }
    if (type === 'ACTIVO') {
      bgColor = '#f4f9ed'; // Muy claro Verde Solidario
      borderColor = '#80ba2733';
      accentColor = '#80ba27'; // Verde Solidario
    }
    if (type === 'VENCIDO') {
      bgColor = '#fef2f2'; // Muy claro Rojo
      borderColor = '#ef444433';
      accentColor = '#ef4444'; // Rojo Solicitado
    }

    const rotation = getRotation(loan.id);

    return (
      <div 
        style={{ 
          background: bgColor, 
          padding: '1.25rem', 
          border: `1px solid ${borderColor}`,
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transform: isHovered ? `scale(1.05) rotate(${rotation}deg)` : `rotate(${rotation}deg)`,
          transition: 'all 0.2s ease',
          minHeight: '140px',
          color: 'var(--text-primary)',
          position: 'relative',
          width: '90%',
          margin: '0 auto 1.25rem auto',
          cursor: 'default',
          zIndex: isHovered ? 10 : 1
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', lineHeight: '1.2' }}>{loan.student.first_name} {loan.student.last_name}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>CC: {loan.student.document_id}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setContactModal({ open: true, student: loan.student })}
              style={{ 
                background: 'rgba(202, 212, 0, 0.1)', 
                border: 'none', 
                borderRadius: '6px', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#8a9100', 
                cursor: 'pointer',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: isHovered ? 'auto' : 'none'
              }}
              title="Contacto"
            >
              <HiOutlinePhone size={18} />
            </button>
            {isOverdue && <HiOutlineExclamationCircle color="#e63946" size={24} title="Préstamo Vencido" />}
          </div>
        </div>
        
        <div style={{ flex: 1, marginTop: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>{loan.item.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85rem' }}>
            <HiOutlineClock size={16} />
            {isRequested ? 'Solicitado hoy' : `Fin: ${formatDate(loan.expected_return_time)}`}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', marginTop: 'auto', gap: '8px' }}>
            {isRequested && (
              <>
                <button 
                  onClick={() => handleApprove(loan.id)} 
                  style={{ background: '#80ba27', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', flex: 1, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(128, 186, 39, 0.2)' }}
                  title="Aprobar Solicitud"
                >
                  <HiOutlineCheckCircle size={16} /> Aprobar
                </button>
                <button 
                  onClick={() => openRejectModal(loan)} 
                  style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', flex: 1, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
                  title="Rechazar Solicitud"
                >
                  <HiOutlineX size={16} /> Rechazar
                </button>
              </>
            )}
            {(type === 'ACTIVO' || type === 'VENCIDO') && (
              <button 
                onClick={() => handleReturn(loan.id)} 
                style={{ background: isOverdue ? '#ef4444' : '#00acc9', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', width: '100%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: `0 2px 4px ${isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 172, 201, 0.2)'}` }}
              >
                <HiOutlineRefresh size={16} /> Devolver
              </button>
            )}
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ title, items, type, isLast }) => (
    <div style={{ 
      flex: 1, 
      minWidth: '280px', 
      display: 'flex',
      flexDirection: 'column',
      borderRight: isLast ? 'none' : '2px solid #e0e0e0',
      backgroundColor: '#fefefe',
      height: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '1.2rem',
        borderBottom: `2px solid #e0e0e0`,
        background: type === 'SOLICITADO' ? '#00acc90a' : (type === 'ACTIVO' ? '#80ba270a' : '#ef44440a')
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          color: type === 'SOLICITADO' ? '#00acc9' : (type === 'ACTIVO' ? '#80ba27' : '#ef4444'), 
          textTransform: 'uppercase', 
          fontWeight: '700',
          letterSpacing: '1px'
        }}>
          {title}
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '2rem 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', opacity: 0.7 }}>
            Sin elementos
          </div>
        ) : (
          items.map(loan => <LoanCard key={loan.id} loan={loan} type={type} />)
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="page-loading"><div className="page-loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flex: 1,
        display: 'flex', 
        background: '#fff',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <KanbanColumn 
          title="SOLICITADOS" 
          items={requested} 
          type="SOLICITADO"
        />
        <KanbanColumn 
          title="ACTIVOS" 
          items={active} 
          type="ACTIVO"
        />
        <KanbanColumn 
          title="VENCIDOS" 
          items={overdue} 
          type="VENCIDO"
          isLast={true}
        />
      </div>

      {rejectModalOpen && (
        <div className="modal-overlay" onClick={closeRejectModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <HiOutlineX color="var(--error)" size={24}/> Rechazar Solicitud
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Estás a punto de rechazar la solicitud de <strong>{rejectingLoan?.item.name}</strong> para <strong>{rejectingLoan?.student.first_name} {rejectingLoan?.student.last_name}</strong>.
              Por favor, indica el motivo del rechazo para notificar al estudiante.
            </p>

            <div className="form-group">
               <label htmlFor="rejectionReason" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Motivo de Rechazo <span style={{color: 'var(--error)'}}>*</span></label>
               <textarea 
                  id="rejectionReason"
                  className="form-input" 
                  rows="4"
                  placeholder="Ej. Implemento en mantenimiento, estudiante suspendido..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                  autoFocus
               ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={closeRejectModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={submitReject}>
                Rechazar Préstamo
              </button>
            </div>
          </div>
        </div>
      )}

      <ContactModal 
        open={contactModal.open} 
        onClose={() => setContactModal({ open: false, student: null })} 
        student={contactModal.student}
      />
    </div>
  );
}
