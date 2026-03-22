import { Link } from 'react-router-dom';
import { HiOutlineEmojiSad } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="utility-page">
      <div style={{ fontSize: '4rem', color: 'var(--accent-primary)', marginBottom: 'var(--space-lg)' }}>
        <HiOutlineEmojiSad />
      </div>
      <div className="utility-page-code">404</div>
      <h1>Página no encontrada</h1>
      <p>La página que buscas no existe o fue movida a otra ubicación.</p>
      <Link to="/dashboard" className="btn btn-primary" style={{ width: 'auto' }}>
        Ir al Dashboard
      </Link>
    </div>
  );
}
