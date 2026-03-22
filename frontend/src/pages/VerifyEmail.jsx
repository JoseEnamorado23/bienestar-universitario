import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verificando tu cuenta...');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    if (!token) {
      setStatus('error');
      setMessage('Enlace de verificación inválido. No se encontró el token.');
      return;
    }

    const verifyToken = async () => {
      hasFetched.current = true;
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || '¡Tu cuenta ha sido verificada exitosamente!');
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.detail || 
          'El enlace de verificación ha expirado o es inválido. Por favor, solicita uno nuevo.'
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="login-container animate-fade-in">
      {/* Decorative background vectors */}
      <div className="bg-vector bg-vector-1"></div>
      <div className="bg-vector bg-vector-2"></div>
      <div className="bg-vector bg-vector-3"></div>

      <div className="login-card" style={{ maxWidth: '450px', width: '100%', margin: '0 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          {status === 'loading' && (
            <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '48px', height: '48px' }}></div>
          )}
          {status === 'success' && (
            <HiOutlineCheckCircle style={{ fontSize: '4rem', color: '#4ade80', margin: '0 auto 1rem' }} />
          )}
          {status === 'error' && (
            <HiOutlineXCircle style={{ fontSize: '4rem', color: '#f87171', margin: '0 auto 1rem' }} />
          )}
          
          <h1 className="login-title" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
            Verificación de Cuenta
          </h1>
          <p className="login-subtitle" style={{ fontSize: '1rem' }}>
            {message}
          </p>
        </div>

        {status === 'success' && (
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Ir a Iniciar Sesión
          </Link>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Reenviar enlace de verificación
            </button>
            <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
