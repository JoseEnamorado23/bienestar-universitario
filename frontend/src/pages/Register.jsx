import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiOutlineUserAdd, HiOutlineExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    national_id: '',
    email: '',
    phone: '',
    program_id: '',
    password: '',
  });
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data } = await api.get('/programs/');
        setPrograms(data);
      } catch (err) {
        console.error("Error al cargar programas", err);
        // Fallback silencioso
      }
    };
    fetchPrograms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        program_id: formData.program_id ? parseInt(formData.program_id, 10) : null
      };

      await api.post('/auth/register', payload);
      
      toast.success('¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error al registrar. Verifica tus datos e intenta de nuevo.';

      if (typeof message === 'string') {
        setError(message);
      } else {
        setError('Error inesperado al registrar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '500px' }}>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <HiOutlineUserAdd />
            </div>
            <h1>Registro de Estudiante</h1>
            <p>Crea tu cuenta en Bienestar Universitario</p>
          </div>

          {error && (
            <div className="login-error">
              <HiOutlineExclamationCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="responsive-grid-2" style={{ gap: '0 1rem' }}>
            <div className="form-group">
              <label htmlFor="first_name">Nombres</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className="form-input"
                placeholder="Tus nombres"
                value={formData.first_name}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Apellidos</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className="form-input"
                placeholder="Tus apellidos"
                value={formData.last_name}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="national_id">Documento de Identidad (Cédula/TI)</label>
              <input
                id="national_id"
                name="national_id"
                type="text"
                className="form-input"
                placeholder="Tu número de documento"
                value={formData.national_id}
                onChange={handleChange}
                required
                minLength={5}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="email">Correo Institucional</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="tu@universidad.edu.co"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Celular</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="Tu teléfono"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="program_id">Programa Académico</label>
              <select
                id="program_id"
                name="program_id"
                className="form-input"
                value={formData.program_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un programa...</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>¿Ya tienes una cuenta? </span>
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '500', textDecoration: 'none' }}>Inicia sesión aquí</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
