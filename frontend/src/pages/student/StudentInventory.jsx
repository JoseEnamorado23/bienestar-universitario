import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCube, HiOutlinePhotograph, HiOutlineClock } from 'react-icons/hi';

export default function StudentInventory() {
  const { user } = useAuth();
  const { setHeaderContent } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title: 'Catálogo de Implementos',
        subtitle: 'Explora los artículos deportivos y de bienestar disponibles. Selecciona el que deseas solicitar.'
      });
    }
  }, [setHeaderContent]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/');
      // Filter out only active items just in case the backend doesn't,
      // though typically catalog for students should only be ACTIVE items.
      setItems(data.filter(i => i.status === 'ACTIVE'));
    } catch (error) {
      toast.error('Error al cargar los implementos disponibles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRequest = async (itemId) => {
    if (!window.confirm('¿Estás seguro de solicitar este implemento? Recuerda que solo puedes tener un implemento a la vez.')) return;
    
    setSubmittingId(itemId);
    try {
      // Assuming student_id is known by the backend or we pass user.id. 
      // In this system, user.id is tied to the Student profile.
      await api.post('/loans/request', {
        item_id: itemId,
        student_id: user.id
      });
      toast.success('¡Solicitud enviada! Dirígete a Bienestar para recoger tu implemento.');
      fetchItems(); // Refresh inventory counts
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al solicitar el implemento.';
      toast.error(msg, { duration: 5000 });
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar-title" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1>Catálogo de Implementos</h1>
        <p>Explora los artículos deportivos y de bienestar disponibles para solicitar</p>
      </div>
      <div style={{ padding: '1rem', background: 'rgba(0, 172, 201, 0.1)', border: '1px solid rgba(0, 172, 201, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
           <HiOutlineClock size={24} color="var(--primary-color)" style={{ flexShrink: 0 }} />
           <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
             <strong>Recuerda:</strong> Solo puedes tener una solicitud o préstamo activo al mismo tiempo. Al realizar tu solicitud, tienes un tiempo límite para recogerlo antes de que expire.
           </p>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <HiOutlineCube size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No hay implementos disponibles</h3>
          <p>En este momento no hay artículos en el catálogo. Intenta más tarde.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', transition: 'transform 0.2s', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-glass)' }}>
              <div style={{ height: '180px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-color)' }}>
                {item.image_url ? (
                  <img src={`http://localhost:8000${item.image_url}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <HiOutlinePhotograph size={48} color="var(--text-muted)" />
                )}
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{item.name}</h3>
                
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                  {item.description || "Sin descripción proporcionada."}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Unidades Disponibles</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: item.available_quantity > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {item.available_quantity}
                  </span>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', opacity: item.available_quantity === 0 ? 0.6 : 1 }}
                  onClick={() => handleRequest(item.id)}
                  disabled={item.available_quantity === 0 || submittingId === item.id}
                >
                  {submittingId === item.id ? (
                    'Enviando...'
                  ) : item.available_quantity === 0 ? (
                    'No Disponible'
                  ) : (
                    'Solicitar Préstamo'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
