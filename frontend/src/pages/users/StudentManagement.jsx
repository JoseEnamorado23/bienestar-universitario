import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineLockClosed, HiOutlineLockOpen, HiOutlinePencil,
  HiOutlinePlus, HiOutlineX, HiOutlineXCircle,
  HiOutlineDuplicate, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineFilter, HiOutlineSortAscending, HiOutlineSortDescending,
  HiOutlineChevronDown, HiOutlineTrash
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/* ── HELPERS ──────────────────────────────── */
const formatDecimalHours = (decimal) => {
  if (!decimal && decimal !== 0) return '00:00';
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/* ── STATUS badge ─────────────────────────── */
function StatusBadge({ status }) {
  if (status === 'ACTIVE') return <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><HiOutlineCheckCircle /> Activo</span>;
  if (status === 'INACTIVE') return <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><HiOutlineXCircle /> Bloqueado</span>;
  return <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><HiOutlineXCircle /> {status}</span>;
}

/* ── MODAL WRAPPER ────────────────────────── */
function ModalWrapper({ title, onClose, children, width = '480px' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: width, border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.25rem', display: 'flex' }}><HiOutlineX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── BLOCK CONFIRMATION MODAL ─────────────── */
function BlockModal({ student, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const isBlocked = student.status === 'INACTIVE';

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(isBlocked ? null : reason);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title={isBlocked ? 'Desbloquear Estudiante' : 'Bloquear Estudiante'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isBlocked
            ? `¿Estás seguro de que quieres desbloquear a ${student.first_name} ${student.last_name}? Podrá realizar solicitudes de préstamo nuevamente.`
            : `¿Estás seguro de que quieres bloquear a ${student.first_name} ${student.last_name}? No podrá realizar solicitudes de préstamo mientras esté bloqueado.`
          }
        </p>
        {!isBlocked && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo del bloqueo <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.7rem' }}>(opcional)</span></label>
            <textarea className="form-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Incumplimiento de normas de préstamo..." style={{ resize: 'vertical' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={saving}
            style={{ background: isBlocked ? '#4ade8022' : '#f8717122', border: `1px solid ${isBlocked ? '#4ade80' : '#f87171'}66`, color: isBlocked ? '#4ade80' : '#f87171', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, width: 'auto' }}
          >
            {saving ? '...' : isBlocked ? 'Sí, desbloquear' : 'Sí, bloquear'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

/* ── EDIT STUDENT MODAL ───────────────────── */
function EditStudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    national_id: student.national_id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/students/${student.id}/info`, form);
      toast.success('Información actualizada');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title="Editar Estudiante" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[['Nombre', 'first_name'], ['Apellido', 'last_name'], ['Cédula / Carnet', 'national_id']].map(([label, field]) => (
          <div key={field} className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            <input className="form-input" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

/* ── ADD HOURS MODAL ──────────────────────── */
function AddHoursModal({ student, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ hours: '', reason: '', date_granted: today });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.hours || !form.reason) { toast.error('Completa todos los campos'); return; }
    setSaving(true);
    try {
      const { data } = await api.post(`/admin/students/${student.id}/additional-hours`, {
        hours: parseFloat(form.hours),
        reason: form.reason,
        date_granted: form.date_granted,
      });
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al añadir horas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title={`Añadir Horas — ${student.first_name} ${student.last_name}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horas a Añadir</label>
          <input className="form-input" type="number" min="0.5" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="Ej: 2" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo</label>
          <textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ej: Actividad voluntaria especial" style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</label>
          <input className="form-input" type="date" value={form.date_granted} onChange={e => setForm(f => ({ ...f, date_granted: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>{saving ? 'Guardando…' : 'Añadir Horas'}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

/* ── ACTION BUTTON ────────────────────────── */
function ActionBtn({ icon, label, colorHex, onClick, isRowHovered }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const btnStyle = {
    position: 'relative',
    background: isBtnHovered ? `${colorHex}22` : (isRowHovered ? `${colorHex}12` : 'rgba(0,0,0,0.04)'),
    border: `1px solid ${isBtnHovered ? colorHex + '99' : (isRowHovered ? colorHex + '44' : 'rgba(0,0,0,0.12)')}`,
    color: isBtnHovered || isRowHovered ? colorHex : '#94a3b8',
    borderRadius: '8px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.95rem',
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
        <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: '0', background: '#1e293b', color: '#fff', fontSize: '0.72rem', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ── STUDENT ROW ──────────────────────────── */
function StudentRow({ student, onAction }) {
  const [isHovered, setIsHovered] = useState(false);
  const isBlocked = student.status === 'INACTIVE';

  return (
    <tr 
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: isHovered ? 'var(--bg-glass)' : 'transparent', transition: 'background 0.2s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: '0.8rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>{student.national_id || '—'}</td>
      <td style={{ padding: '0.8rem 1rem', fontSize: '0.875rem' }}>
        {student.first_name} {student.last_name}
        {isBlocked && student.block_reason && (
          <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '2px', opacity: 0.8 }}>
            Motivo: {student.block_reason}
          </div>
        )}
      </td>
      <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.program_name}</td>
      <td style={{ padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
          <HiOutlineClock style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatDecimalHours(student.social_hours_required)}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span>{formatDecimalHours(student.social_hours_completed)}</span>
        </div>
      </td>
      <td style={{ padding: '0.8rem 1rem' }}><StatusBadge status={student.status} /></td>
      <td style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{student.email}</div>
        {student.phone && (
          <div style={{ fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {student.phone}
            <button 
              onClick={() => {
                navigator.clipboard.writeText(student.phone);
                toast.success('Teléfono copiado', { id: 'copy-phone' });
              }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)', transition: 'color 0.2s', opacity: 0.6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Copiar número"
            >
              <HiOutlineDuplicate style={{ fontSize: '0.85rem' }} />
            </button>
          </div>
        )}
      </td>
      <td style={{ padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ActionBtn 
            icon={<HiOutlineClock style={{ transform: 'scale(1.1)' }} />} 
            label="Ver Horas" 
            colorHex="#00acc9" 
            onClick={() => onAction('view-hours', student)} 
            isRowHovered={isHovered}
          />
          <ActionBtn
            icon={isBlocked ? <HiOutlineLockOpen /> : <HiOutlineLockClosed />}
            label={isBlocked ? 'Desbloquear' : 'Bloquear'}
            colorHex={isBlocked ? '#4ade80' : '#f87171'}
            onClick={() => onAction('block', student)}
            isRowHovered={isHovered}
          />
          <ActionBtn 
            icon={<HiOutlinePencil />} 
            label="Editar" 
            colorHex="#00acc9" 
            onClick={() => onAction('edit', student)} 
            isRowHovered={isHovered}
          />
          <ActionBtn 
            icon={<HiOutlinePlus />} 
            label="Añadir horas" 
            colorHex="#80ba27" 
            onClick={() => onAction('hours', student)} 
            isRowHovered={isHovered}
          />
        </div>
      </td>
    </tr>
  );
}

/* ── MAIN COMPONENT ───────────────────────── */
export default function StudentManagement() {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  
  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Gestión de Estudiantes',
        subtitle: 'Visualiza y administra la información de los estudiantes y sus horas sociales.'
      });
    }
  }, [setHeaderContent]);
  
  // States for query params
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ program_id: '', status: '' });
  const [sorting, setSorting] = useState({ sort_by: 'id', order: 'desc' });
  
  const [modal, setModal] = useState(null); // { type, student }
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const filterRef = useRef(null);
  const sortRef = useRef(null);

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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
        search: search || undefined,
        program_id: filters.program_id || undefined,
        status: filters.status || undefined,
        sort_by: sorting.sort_by,
        order: sorting.order
      };
      
      const { data } = await api.get('/admin/students', { params });
      setStudents(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);
  useEffect(() => { fetchStudents(); }, [page, limit, search, filters, sorting]);

  // Reset page to 1 when filters or search change
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleAction = (type, student) => {
    if (type === 'view-hours') {
      navigate(`/dashboard/horas?userId=${student.id}`);
      return;
    }
    setModal({ type, student });
  };

  const handleToggleStatus = async (reason) => {
    const student = modal.student;
    const isBlocked = student.status === 'INACTIVE';
    const newStatus = isBlocked ? 'ACTIVE' : 'INACTIVE';
    const label = newStatus === 'INACTIVE' ? 'bloqueado' : 'desbloqueado';
    try {
      await api.patch(`/admin/students/${student.id}/status`, { status: newStatus, block_reason: reason });
      toast.success(`Estudiante ${label} correctamente`);
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al cambiar estado');
      throw e; // re-throw so modal knows
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.email?.toLowerCase().includes(q) ||
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.national_id?.includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      {modal?.type === 'block' && <BlockModal student={modal.student} onClose={() => setModal(null)} onConfirm={handleToggleStatus} />}
      {modal?.type === 'edit' && <EditStudentModal student={modal.student} onClose={() => setModal(null)} onSaved={fetchStudents} />}
      {modal?.type === 'hours' && <AddHoursModal student={modal.student} onClose={() => setModal(null)} onSaved={fetchStudents} />}

      <div className="info-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Estudiantes</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar..."
                style={{ paddingLeft: '36px', marginBottom: 0, height: '38px', width: '100%' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filters Dropdown */}
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button 
                className="btn btn-ghost" 
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', border: '1px solid var(--border-color)', background: filters.program_id || filters.status ? 'var(--accent-primary)11' : 'transparent' }}
                onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
              >
                <HiOutlineFilter style={{ color: filters.program_id || filters.status ? 'var(--accent-primary)' : 'inherit' }} />
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
                      <option value="ACTIVE">Activos</option>
                      <option value="INACTIVE">Bloqueados</option>
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
                    <option value="id">Más Recientes</option>
                    <option value="first_name">Nombre</option>
                    <option value="last_name">Apellido</option>
                    <option value="social_hours_completed">Horas Completadas</option>
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

            {/* Reset Button */}
            {(filters.program_id || filters.status || search || sorting.sort_by !== 'id' || sorting.order !== 'desc') && (
              <button 
                className="btn btn-ghost"
                style={{ height: '38px', width: '38px', padding: 0, border: '1px solid var(--border-color)', color: '#ef4444' }}
                title="Limpiar filtros"
                onClick={() => {
                  setFilters({ program_id: '', status: '' });
                  setSorting({ sort_by: 'id', order: 'desc' });
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


        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            Cargando estudiantes...
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    {['Cédula / Carnet', 'Nombre / Apellido', 'Programa', 'Horas (Nec/Comp)', 'Estado', 'Contacto', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <StudentRow key={student.id} student={student} onAction={handleAction} />
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No se encontraron estudiantes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{students.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> estudiantes
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
    </div>
  );
}
