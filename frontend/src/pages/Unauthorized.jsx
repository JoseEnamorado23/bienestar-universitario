import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

export default function Unauthorized() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="utility-page">
      <div style={{ fontSize: '4rem', color: 'var(--warning)', marginBottom: 'var(--space-lg)' }}>
        <HiOutlineShieldExclamation />
      </div>
      <div className="utility-page-code">403</div>
      <h1>Acceso Denegado</h1>
      <p>No tienes los permisos necesarios para acceder a esta sección del sistema.</p>
      <Link
        to={isAuthenticated ? '/dashboard' : '/login'}
        className="btn btn-primary"
        style={{ width: 'auto' }}
      >
        {isAuthenticated ? 'Volver al Dashboard' : 'Iniciar Sesión'}
      </Link>
    </div>
  );
}
