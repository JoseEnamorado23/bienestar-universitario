import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  HiOutlineClock, HiOutlineClipboardList, HiOutlineCalendar, 
  HiOutlinePlus, HiOutlineAcademicCap,
  HiOutlineCheckCircle, HiOutlineChevronLeft, HiOutlineChevronDown,
  HiOutlineChevronRight
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function SocialHours() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId') || user.id;
  const isViewingOther = targetUserId !== user.id;

  const [studentInfo, setStudentInfo] = useState(null);
  const [loans, setLoans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [additionalHours, setAdditionalHours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedSections, setExpandedSections] = useState({
    loans: true,
    activities: true,
    additional: true
  });

  const [isAddHoursModalOpen, setIsAddHoursModalOpen] = useState(false);
  const [newHours, setNewHours] = useState({ hours: '', reason: '', date_granted: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: student } = await api.get(`/admin/students/${targetUserId}`);
      setStudentInfo(student);

      const [loansRes, activitiesRes, additionalRes] = await Promise.all([
        api.get(`/admin/students/${targetUserId}/loans`),
        api.get(isViewingOther ? `/admin/students/${targetUserId}/activities` : '/activities/my-activities/history'),
        api.get(`/admin/students/${targetUserId}/additional-hours`)
      ]);

      setLoans(loansRes.data);
      setActivities(activitiesRes.data);
      setAdditionalHours(additionalRes.data);
      
      if (!isViewingOther) {
        const total = [...loansRes.data, ...activitiesRes.data, ...additionalRes.data]
          .reduce((acc, curr) => acc + (curr.hours_earned || curr.hours || 0), 0);
        setStudentInfo(prev => ({ ...prev, social_hours_completed: total }));
      }

    } catch (err) {
      toast.error('Error al cargar información del estudiante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  const handleAddHours = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/students/${targetUserId}/additional-hours`, {
        hours: parseFloat(newHours.hours),
        reason: newHours.reason,
        date_granted: newHours.date_granted
      });
      toast.success('Horas añadidas con éxito');
      setIsAddHoursModalOpen(false);
      setNewHours({ hours: '', reason: '', date_granted: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error('Error al añadir horas');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="page-loading"><div className="page-loading-spinner"></div></div>;

  const hasLoans = loans.length > 0;
  const hasActivities = activities.length > 0;
  const hasAdditional = additionalHours.length > 0;

  const formatDecimalHours = (decimal) => {
    if (!decimal && decimal !== 0) return '00:00';
    const totalMinutes = Math.round(decimal * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const progress = studentInfo?.social_hours_required > 0 
    ? Math.min((studentInfo?.social_hours_completed / studentInfo?.social_hours_required) * 100, 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Main Unified Panel */}
      <div className="info-panel" style={{ padding: '1.5rem', minHeight: 'calc(100vh - 160px)' }}>
        {/* Top Header with Back Button and Student Info */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minWidth: '300px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0,172,201,0.1)', color: '#00acc9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HiOutlineAcademicCap size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', textTransform: 'capitalize' }}>{studentInfo?.first_name} {studentInfo?.last_name}</h2>
                <p style={{ margin: '2px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {studentInfo?.program_name} • {studentInfo?.email}
                </p>
                
                {/* Progress Bar Area */}
                <div style={{ marginTop: '1rem', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 500 }}>Progreso de Horas Sociales</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDecimalHours(studentInfo?.social_hours_completed)} / {formatDecimalHours(studentInfo?.social_hours_required)} h
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${progress}%`, 
                        height: '100%', 
                        background: progress >= 100 ? 'var(--success)' : 'var(--accent-primary)', 
                        borderRadius: '4px', 
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
              {isViewingOther && (
                <button 
                  className="btn btn-ghost" 
                  onClick={() => navigate('/dashboard/estudiantes')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem', height: '34px', background: 'white' }}
                >
                  <HiOutlineChevronLeft /> Volver a Estudiantes
                </button>
              )}
              {user.role !== 'student' && !hasAdditional && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsAddHoursModalOpen(true)} 
                  style={{ padding: '4px 10px', fontSize: '0.72rem', height: '28px', width: 'fit-content' }}
                >
                  <HiOutlinePlus size={12} /> Agregar Horas Manuales
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Accordion: Loans */}
          {hasLoans && (
            <div style={{ border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('loans')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedSections.loans ? 'rgba(0,0,0,0.02)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(128,186,39,0.1)', color: '#80ba27' }}>
                    <HiOutlineClipboardList size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Préstamos de Implementos</h3>
                </div>
                {expandedSections.loans ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
              </div>
              
              {expandedSections.loans && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Implemento</th>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Estado</th>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Inicio</th>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Devolución</th>
                          <th style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 500 }}>Horas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map(loan => (
                          <tr key={loan.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px 4px' }}>{loan.item_name}</td>
                            <td style={{ padding: '10px 4px' }}>
                              <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '10px', background: loan.status === 'DEVUELTO' ? 'rgba(128,186,39,0.1)' : 'rgba(0,172,201,0.1)', color: loan.status === 'DEVUELTO' ? '#80ba27' : '#00acc9' }}>
                                {loan.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {loan.start_time ? new Date(loan.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td style={{ padding: '10px 4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {loan.returned_time ? new Date(loan.returned_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{formatDecimalHours(loan.hours_earned)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion: Activities */}
          {hasActivities && (
            <div style={{ border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('activities')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedSections.activities ? 'rgba(0,0,0,0.02)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(240,147,251,0.1)', color: '#f093fb' }}>
                    <HiOutlineCalendar size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Asistencia a Actividades</h3>
                </div>
                {expandedSections.activities ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
              </div>

              {expandedSections.activities && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Actividad</th>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Fecha</th>
                          <th style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 500 }}>Horas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map(act => (
                          <tr key={act.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px 4px' }}>{act.activity_name}</td>
                            <td style={{ padding: '10px 4px' }}>{new Date(act.scanned_at || act.date).toLocaleDateString()}</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{formatDecimalHours(act.hours_earned)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion: Additional Hours */}
          {(hasAdditional || user.role !== 'student') && (
            <div style={{ border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('additional')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedSections.additional ? 'rgba(0,0,0,0.02)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(79,172,254,0.1)', color: '#4facfe' }}>
                    <HiOutlineClock size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Horas Adicionales</h3>
                  {user.role !== 'student' && hasAdditional && (
                    <button 
                      className="btn btn-primary" 
                      onClick={(e) => { e.stopPropagation(); setIsAddHoursModalOpen(true); }}
                      style={{ marginLeft: '1rem', padding: '2px 6px', fontSize: '0.62rem', height: '20px', width: 'fit-content' }}
                    >
                      <HiOutlinePlus size={10} /> Añadir
                    </button>
                  )}
                </div>
                {expandedSections.additional ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
              </div>

              {expandedSections.additional && hasAdditional && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Motivo</th>
                          <th style={{ padding: '10px 4px', fontWeight: 500 }}>Fecha</th>
                          <th style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 500 }}>Horas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {additionalHours.map(record => (
                          <tr key={record.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '10px 4px' }}>{record.reason}</td>
                            <td style={{ padding: '10px 4px' }}>{new Date(record.date_granted).toLocaleDateString()}</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{formatDecimalHours(record.hours)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {expandedSections.additional && !hasAdditional && user.role !== 'student' && (
                <div style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>No hay horas manuales registradas.</p>
                  <button className="btn btn-primary" onClick={() => setIsAddHoursModalOpen(true)} style={{ padding: '4px 10px', fontSize: '0.72rem', height: '28px', width: 'fit-content', margin: '0 auto' }}>
                    <HiOutlinePlus size={12} /> Agregar Primera Hora Manual
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Hours Modal */}
      {isAddHoursModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddHoursModalOpen(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Agregar Horas Manuales</h3>
            <form onSubmit={handleAddHours} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Cantidad de Horas</label>
                <input 
                  type="number" 
                  step="0.5" 
                  className="form-input" 
                  value={newHours.hours} 
                  onChange={e => setNewHours({...newHours, hours: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <textarea 
                  className="form-input" 
                  value={newHours.reason} 
                  onChange={e => setNewHours({...newHours, reason: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newHours.date_granted} 
                  onChange={e => setNewHours({...newHours, date_granted: e.target.value})} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddHoursModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
