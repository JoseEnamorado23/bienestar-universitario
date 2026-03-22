import { useState, useEffect } from 'react';
import { HiOutlineCog, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function SettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/settings');
      // Store a draft copy in state to edit
      setSettings(data);
    } catch (error) {
      toast.error('Error al cargar la configuración del sistema');
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare data for backend: only needs key and value
    const updates = settings.map(item => ({
      key: item.key,
      value: item.value
    }));

    try {
      await api.patch('/settings', updates);
      toast.success('Configuración guardada correctamente');
      onClose();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al guardar la configuración';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (index, newValue) => {
    const updated = [...settings];
    updated[index].value = newValue;
    setSettings(updated);
  };

  const handleTimeChange = (index, key, timeValue) => {
    if (!timeValue) return;
    // Database and API now store "HH:MM", pass it transparently
    handleValueChange(index, timeValue);
  };

  const isTimeField = (key) => {
    return (key.includes('MINUTOS') || key.includes('HORAS')) && !key.includes('SOCIALES');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2><HiOutlineCog className="mr-2" style={{ verticalAlign: 'middle' }} /> Configuración del Sistema</h2>
          <button className="btn-icon" onClick={onClose}><HiOutlineX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body p-4">
          <div style={{ minHeight: '200px' }}>
            {fetching ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="spinner"></div>
                <span className="ml-2">Cargando configuraciones...</span>
              </div>
            ) : settings.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay configuraciones disponibles en el sistema.
              </div>
            ) : (
              <div className="form-group mb-0" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {settings.map((item, index) => (
                  <div key={item.key}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                      {item.key.replace(/_/g, ' ')}
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {item.description || "Sin descripción"}
                    </p>
                    {item.value === 'true' || item.value === 'false' || item.key === 'MODO_MANTENIMIENTO' || item.key === 'PERMITIR_REGISTRO_ESTUDIANTES' ? (
                      <select
                        className="form-input"
                        value={item.value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        required
                      >
                        <option value="true">Sí (Activo)</option>
                        <option value="false">No (Inactivo)</option>
                      </select>
                    ) : isTimeField(item.key) ? (
                      <input 
                        type="time" 
                        className="form-input" 
                        value={item.value || ''} 
                        onChange={(e) => handleTimeChange(index, item.key, e.target.value)}
                        required
                      />
                    ) : item.key.includes('INTENTOS_MAXIMOS') || item.key.includes('HORAS_SOCIALES_REQUERIDAS') || (!isNaN(item.value) && item.value.trim() !== '') ? (
                      <input 
                        type="number" 
                        className="form-input" 
                        value={item.value} 
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        required
                        min="0"
                      />
                    ) : (
                      <input 
                        type="text" 
                        className="form-input" 
                        value={item.value} 
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading || fetching}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || fetching}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
