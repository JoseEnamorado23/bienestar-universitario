import { useState, useEffect } from 'react';
import { 
  HiOutlineDownload, HiOutlineDocumentText, HiOutlineDocumentReport,
  HiOutlineX, HiOutlineFilter, HiOutlineSortAscending, HiOutlineSortDescending,
  HiOutlineTrash
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STUDENT_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'first_name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'national_id', label: 'Identificación' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'program_name', label: 'Programa' },
  { key: 'social_hours_completed', label: 'Horas' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Fecha Registro' }
];

const LOAN_FIELDS = [
  { key: 'first_name', label: 'Nombre Estudiante' },
  { key: 'last_name', label: 'Apellido Estudiante' },
  { key: 'national_id', label: 'Identificación' },
  { key: 'program_name', label: 'Programa' },
  { key: 'item_name', label: 'Implemento' },
  { key: 'status', label: 'Estado' },
  { key: 'start_time', label: 'Inicio' },
  { key: 'returned_time', label: 'Devolución' },
  { key: 'hours_earned', label: 'Horas' },
  { key: 'issuer_name', label: 'Aprobado por' },
  { key: 'created_at', label: 'Fecha Solicitud' }
];

const ACTIVITIES_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'activity_title', label: 'Actividad' },
  { key: 'first_name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'national_id', label: 'Identificación' },
  { key: 'program_name', label: 'Programa' },
  { key: 'hours_earned', label: 'Horas' },
  { key: 'scanned_at', label: 'Fecha Escaneo' },
  { key: 'activity_status', label: 'Estado Actividad' }
];

export default function ReportModal({ isOpen, onClose, type }) {
  const availableFields = type === 'students' ? STUDENT_FIELDS : (type === 'loans' ? LOAN_FIELDS : ACTIVITIES_FIELDS);
  
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [programs, setPrograms] = useState([]);
  
  // Selected fields
  const [selectedFields, setSelectedFields] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({ program_id: '', status: '', date_from: '', date_to: '' });
  const [sorting, setSorting] = useState({ sort_by: 'created_at', order: 'desc' });

  useEffect(() => {
    if (isOpen) {
      setSelectedFields(availableFields.map(f => f.key));
      setFilters({ program_id: '', status: '', date_from: '', date_to: '' });
      setSorting({ sort_by: 'created_at', order: 'desc' });
      fetchPrograms();
    }
  }, [isOpen, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (e) {
      console.error('Error fetching programs', e);
    }
  };

  const toggleField = (key) => {
    setSelectedFields(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) {
          toast.error("Debe seleccionar al menos un campo");
          return prev;
        }
        return prev.filter(f => f !== key);
      }
      return [...prev, key];
    });
  };

  const handleDownload = async (format) => {
    if (selectedFields.length === 0) {
      toast.error('Seleccione al menos un campo');
      return;
    }
    setDownloadingFormat(format);
    try {
      const params = {
        type: type,
        format: format,
        fields: selectedFields.join(','),
        program_id: filters.program_id || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from ? `${filters.date_from}T00:00:00` : undefined,
        date_to: filters.date_to ? `${filters.date_to}T23:59:59` : undefined,
        sort_by: sorting.sort_by,
        order: sorting.order
      };

      const response = await api.get('/reports/download', {
        params,
        responseType: 'blob', // Important for files
        timeout: 60000 // give it a minute
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const ext = format === 'excel' ? 'xlsx' : format;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `reporte_${type}_${dateStr}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar el reporte');
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale" style={{ maxWidth: '600px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineDocumentReport style={{ color: 'var(--accent-primary)' }} />
            Generar Reporte de {type === 'students' ? 'Estudiantes' : (type === 'loans' ? 'Préstamos' : 'Actividades')}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <HiOutlineX />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Filters Section */}
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineFilter /> Filtros y Ordenamiento
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Carrera</label>
                <select 
                  className="form-input" 
                  style={{ marginBottom: 0, padding: '0.5rem' }}
                  value={filters.program_id}
                  onChange={e => setFilters(f => ({ ...f, program_id: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Estado</label>
                <select 
                  className="form-input" 
                  style={{ marginBottom: 0, padding: '0.5rem' }}
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {type === 'students' ? (
                    <>
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </>
                  ) : type === 'loans' ? (
                    <>
                      <option value="SOLICITADO">Solicitado</option>
                      <option value="ACTIVO">Activo</option>
                      <option value="VENCIDO">Vencido</option>
                      <option value="DEVUELTO">Devuelto</option>
                      <option value="RECHAZADO">Rechazado</option>
                    </>
                  ) : (
                    <>
                      <option value="PUBLISHED">Publicadas</option>
                      <option value="FINISHED">Finalizadas</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Desde</label>
                <input 
                  type="date" className="form-input" style={{ marginBottom: 0, padding: '0.5rem' }}
                  value={filters.date_from}
                  onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Hasta</label>
                <input 
                  type="date" className="form-input" style={{ marginBottom: 0, padding: '0.5rem' }}
                  value={filters.date_to}
                  onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Ordenar Por</label>
                <select 
                  className="form-input" 
                  style={{ marginBottom: 0, padding: '0.5rem' }}
                  value={sorting.sort_by}
                  onChange={e => setSorting(s => ({ ...s, sort_by: e.target.value }))}
                >
                  {availableFields.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Dirección</label>
                <div style={{ display: 'flex', gap: '8px', height: '38px' }}>
                  <button 
                    className={`btn ${sorting.order === 'asc' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, padding: '0', border: '1px solid var(--border-color)' }}
                    onClick={() => setSorting(s => ({ ...s, order: 'asc' }))}
                  >
                    <HiOutlineSortAscending title="Ascendente" />
                  </button>
                  <button 
                    className={`btn ${sorting.order === 'desc' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, padding: '0', border: '1px solid var(--border-color)' }}
                    onClick={() => setSorting(s => ({ ...s, order: 'desc' }))}
                  >
                    <HiOutlineSortDescending title="Descendente" />
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto', color: 'var(--text-muted)' }}
                onClick={() => {
                  setFilters({ program_id: '', status: '', date_from: '', date_to: '' });
                  setSorting({ sort_by: 'created_at', order: 'desc' });
                }}
              >
                <HiOutlineTrash /> Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiOutlineDocumentReport /> Columnas a Incluir
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-ghost" 
                  style={{ fontSize: '0.75rem', padding: '4px 8px', height: 'auto' }} 
                  onClick={() => setSelectedFields(availableFields.map(f => f.key))}
                >
                  Todas
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ fontSize: '0.75rem', padding: '4px 8px', height: 'auto', color: '#ef4444' }} 
                  onClick={() => setSelectedFields([availableFields[0].key])}
                >
                  Ninguna
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
              {availableFields.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedFields.includes(f.key)}
                    onChange={() => toggleField(f.key)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Selecciona el formato de descarga:
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn" 
              style={{ background: '#ef4444', color: 'white', minWidth: '100px' }}
              onClick={() => handleDownload('pdf')}
              disabled={downloadingFormat !== null}
            >
              {downloadingFormat === 'pdf' ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: 'white'}}></span> : <HiOutlineDocumentText />}
              <span>PDF</span>
            </button>
            <button 
              className="btn" 
              style={{ background: '#10b981', color: 'white', minWidth: '100px' }}
              onClick={() => handleDownload('excel')}
              disabled={downloadingFormat !== null}
            >
              {downloadingFormat === 'excel' ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: 'white'}}></span> : <HiOutlineDocumentReport />}
              <span>Excel</span>
            </button>
            <button 
              className="btn" 
              style={{ background: '#3b82f6', color: 'white', minWidth: '100px' }}
              onClick={() => handleDownload('csv')}
              disabled={downloadingFormat !== null}
            >
              {downloadingFormat === 'csv' ? <span className="spinner" style={{width: 16, height: 16, borderTopColor: 'white'}}></span> : <HiOutlineDownload />}
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
