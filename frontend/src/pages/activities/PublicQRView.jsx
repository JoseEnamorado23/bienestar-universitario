import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import QRDisplay from '../../components/QRDisplay';
import { HiOutlineClock, HiOutlineInformationCircle } from 'react-icons/hi';

export default function PublicQRView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get(`/activities/${id}/public-qr-data`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar el código QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refrescar cada 8 segundos para QRs dinámicos o simplemente para mantener sincronía
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !data) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, textAlign: 'center' }}>
      <div className="info-panel" style={{ maxWidth: 400 }}>
        <h2 style={{ color: '#ef4444' }}>Error</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '40px 20px'
    }}>
      <div className="animate-fade-in" style={{ 
        background: '#ffffff', 
        padding: '60px 40px', 
        borderRadius: 40, 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        maxWidth: 600,
        width: '100%'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>
          ¡Registra tu asistencia!
        </h1>
        <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: 60, fontWeight: 500 }}>
          {data.title}
        </p>

        <div style={{ transform: 'scale(1.8)', margin: '100px 0' }}>
          <QRDisplay token={data.qr_token} size={200} title={`QR-${data.title}`} showDownload={false} />
        </div>

        <div style={{ 
          marginTop: 60, 
          padding: '20px', 
          background: '#f1f5f9', 
          borderRadius: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          color: '#475569',
          fontWeight: 600
        }}>
          {data.qr_type === 'DYNAMIC' ? (
            <>
              <HiOutlineClock className="animate-pulse" size={24} color="#00acc9" />
              <span>El código se actualiza automáticamente</span>
            </>
          ) : (
            <>
              <HiOutlineInformationCircle size={24} color="#80ba27" />
              <span>Código {data.qr_type.toLowerCase()} válido ahora</span>
            </>
          )}
        </div>
      </div>
      
      <p style={{ marginTop: 40, color: '#94a3b8', fontSize: '0.9rem' }}>
        Plataforma de Bienestar Universitario
      </p>
    </div>
  );
}
