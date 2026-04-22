import { HiOutlineMenuAlt2 } from 'react-icons/hi';

export default function Header({ title, subtitle, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="header-burger" onClick={onToggleSidebar}>
          <HiOutlineMenuAlt2 />
        </button>
      </div>

      <div className="header-center">
        <div className="header-title">
          <h1 className="header-main-title" style={{ color: title === 'Tablero Kanban' ? 'var(--accent-primary)' : 'inherit', margin: 0 }}>{title || 'Sistema de Bienestar'}</h1>
          <p className="header-main-subtitle" style={{ margin: 0, opacity: 0.8 }}>{subtitle || 'Universidad — Panel de Control'}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Placeholder if needed */}
      </div>
    </header>
  );
}
