import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash,
  HiOutlineSearch, HiOutlineFilter, HiOutlineChevronDown,
  HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineCheckCircle, HiOutlineAcademicCap
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ProgramModal from './ProgramModal';

/* ── ACTION BUTTON ────────────────────────── */
function ActionBtn({ icon, label, colorHex, onClick, isRowHovered, disabled }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const btnStyle = {
    position: 'relative',
    background: isBtnHovered ? `${colorHex}22` : (isRowHovered ? `${colorHex}12` : 'rgba(0,0,0,0.04)'),
    border: `1px solid ${isBtnHovered ? colorHex + '99' : (isRowHovered ? colorHex + '44' : 'rgba(0,0,0,0.12)')}`,
    color: isBtnHovered || isRowHovered ? colorHex : '#94a3b8',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsBtnHovered(true)}
      onMouseLeave={() => setIsBtnHovered(false)}
      style={btnStyle}
      disabled={disabled}
    >
      {icon}
      {isBtnHovered && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          right: '0',
          background: '#1e293b',
          color: '#fff',
          fontSize: '0.72rem',
          padding: '4px 10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ── PROGRAM ROW ─────────────────────────── */
function ProgramRow({ program, onEdit, onToggleStatus, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: isHovered ? 'var(--bg-glass)' : 'transparent',
        transition: 'background 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td data-label="Programa" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: program.is_active ? 'rgba(128,186,39,0.1)' : 'rgba(239,68,68,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${program.is_active ? 'rgba(128,186,39,0.2)' : 'rgba(239,68,68,0.15)'}`,
            flexShrink: 0
          }}>
            <HiOutlineAcademicCap size={20} color={program.is_active ? '#80ba27' : '#ef4444'} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{program.name}</div>
          </div>
        </div>
      </td>
      <td data-label="Estudiantes" style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
        <span style={{
          fontWeight: 700,
          fontSize: '1rem',
          color: (program.student_count || 0) > 0 ? '#00acc9' : 'var(--text-muted)',
          background: (program.student_count || 0) > 0 ? 'rgba(0,172,201,0.1)' : 'rgba(0,0,0,0.04)',
          padding: '4px 14px',
          borderRadius: '8px'
        }}>
          {program.student_count || 0}
        </span>
      </td>
      <td data-label="Estado" style={{ padding: '0.85rem 1rem' }}>
        <span style={{
          fontSize: '0.7rem',
          padding: '3px 10px',
          borderRadius: '20px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: program.is_active ? 'rgba(128,186,39,0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: program.is_active ? '#80ba27' : '#ef4444',
          border: `1px solid ${program.is_active ? 'rgba(128,186,39,0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {program.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td data-label="Acciones" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <ActionBtn
            icon={<HiOutlinePencilAlt />}
            label="Editar"
            colorHex="#00acc9"
            onClick={() => onEdit(program)}
            isRowHovered={isHovered}
          />
          {program.is_active ? (
            <ActionBtn
              icon={<HiOutlineTrash />}
              label="Inhabilitar"
              colorHex="#ef4444"
              onClick={() => onToggleStatus(program)}
              isRowHovered={isHovered}
            />
          ) : (
            <ActionBtn
              icon={<HiOutlineCheckCircle />}
              label="Reactivar"
              colorHex="#80ba27"
              onClick={() => onToggleStatus(program)}
              isRowHovered={isHovered}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── MAIN COMPONENT ──────────────────────── */
export default function ProgramManagement() {
  const { setHeaderContent } = useOutletContext();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtering & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Programas Académicos',
        subtitle: 'Gestiona los programas académicos de la institución.'
      });
    }
  }, [setHeaderContent]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/programs/with-stats', { params: { include_inactive: true } });
      setPrograms(data);
    } catch (error) {
      toast.error('Error al cargar programas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
    setSelectedProgram(null);
    setIsModalOpen(true);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (program) => {
    const newStatus = !program.is_active;
    const action = newStatus ? 'reactivar' : 'inhabilitar';

    if (!window.confirm(`¿Estás seguro de ${action} el programa "${program.name}"?`)) return;

    try {
      if (!newStatus && (program.student_count || 0) === 0) {
        // No students, offer to delete
        const shouldDelete = window.confirm(
          `El programa "${program.name}" no tiene estudiantes asociados.\n¿Deseas eliminarlo permanentemente?\n\n(Cancelar para solo inhabilitar)`
        );
        if (shouldDelete) {
          await api.delete(`/programs/${program.id}`);
          toast.success('Programa eliminado permanentemente');
          fetchPrograms();
          return;
        }
      }

      await api.put(`/programs/${program.id}`, { is_active: newStatus });
      toast.success(`Programa ${newStatus ? 'reactivado' : 'inhabilitado'} correctamente`);
      fetchPrograms();
    } catch (err) {
      toast.error(`Error al ${action} el programa`);
    }
  };

  const onModalSave = () => {
    setIsModalOpen(false);
    fetchPrograms();
  };

  // Local filtering
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.is_active) ||
      (statusFilter === 'INACTIVE' && !p.is_active);
    return matchesSearch && matchesStatus;
  });

  const total = filteredPrograms.length;
  const paginatedPrograms = filteredPrograms.slice((page - 1) * limit, page * limit);

  if (loading) {
    return <div className="page-loading"><div className="page-loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="info-panel">
        {/* Toolbar */}
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h1>Programas Académicos</h1>
            <p>Gestiona los programas de la institución</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '350px', display: 'flex', alignItems: 'center' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar programa..."
                style={{ paddingLeft: '36px', marginBottom: 0, height: '40px', width: '100%', borderRadius: '10px' }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Filters */}
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button
                className="btn btn-ghost"
                style={{
                  height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '0 14px', border: '1px solid var(--border-color)', borderRadius: '10px',
                  background: statusFilter !== 'ALL' ? 'rgba(128,186,39,0.08)' : 'transparent'
                }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <HiOutlineFilter style={{ color: statusFilter !== 'ALL' ? '#80ba27' : 'inherit' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Filtros</span>
                <HiOutlineChevronDown style={{ fontSize: '0.85rem', opacity: 0.5 }} />
              </button>

              {showFilters && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '14px', padding: '1.25rem', zIndex: 50,
                  boxShadow: '0 15px 35px rgba(0,0,0,0.12)', width: '240px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                    Estado del Programa
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['ALL', 'ACTIVE', 'INACTIVE'].map(val => (
                      <button
                        key={val}
                        onClick={() => { setStatusFilter(val); setPage(1); setShowFilters(false); }}
                        style={{
                          padding: '8px 12px', textAlign: 'left',
                          background: statusFilter === val ? 'rgba(128,186,39,0.1)' : 'transparent',
                          color: statusFilter === val ? '#80ba27' : 'var(--text-primary)',
                          border: 'none', borderRadius: '8px', fontSize: '0.85rem',
                          fontWeight: statusFilter === val ? 600 : 400,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {val === 'ALL' ? 'Todos' : val === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreate}
              style={{ height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', fontSize: '0.85rem', width: 'fit-content' }}
            >
              <HiOutlinePlus size={18} />
              <span style={{ fontWeight: 600 }}>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Programa</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Estudiantes</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrograms.map((program) => (
                <ProgramRow
                  key={program.id}
                  program={program}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                />
              ))}

              {paginatedPrograms.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <HiOutlineAcademicCap size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>No se encontraron programas registrados.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Mostrando <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{paginatedPrograms.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span> programas
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filas:</span>
              <select
                className="form-input"
                style={{ width: '70px', marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.85rem', borderRadius: '8px' }}
                value={limit}
                onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.4rem', minWidth: '36px', borderRadius: '8px' }}
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <HiOutlineChevronLeft />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                {page} / {Math.ceil(total / limit) || 1}
              </div>

              <button
                className="btn btn-ghost"
                style={{ padding: '0.4rem', minWidth: '36px', borderRadius: '8px' }}
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(p => p + 1)}
              >
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedProgram={selectedProgram}
        onSave={onModalSave}
      />
    </div>
  );
}
