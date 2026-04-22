import { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ProgramModal({ isOpen, onClose, selectedProgram, onSave }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(selectedProgram ? selectedProgram.name : '');
    }
  }, [isOpen, selectedProgram]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del programa es obligatorio');
      return;
    }

    setLoading(true);
    try {
      if (selectedProgram) {
        await api.put(`/programs/${selectedProgram.id}`, { name: name.trim() });
        toast.success('Programa actualizado correctamente');
      } else {
        await api.post('/programs/', { name: name.trim(), is_active: true });
        toast.success('Programa creado correctamente');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar programa');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  };

  const contentStyle = {
    backgroundColor: '#ffffff', borderRadius: '12px', width: '90%',
    maxWidth: '460px', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.1)'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} className="animate-fade-in" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {selectedProgram ? 'Editar Programa' : 'Nuevo Programa'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <HiX size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <form id="program-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Programa</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="Ej. Ingeniería de Sistemas"
              />
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="program-form" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
