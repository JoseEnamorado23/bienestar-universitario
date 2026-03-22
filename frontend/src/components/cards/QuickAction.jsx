import { Link } from 'react-router-dom';

export default function QuickAction({ label, description, path, icon: Icon, color, onClick }) {
  const isModalTrigger = path?.startsWith('modal:');

  const content = (
    <>
      <div className="quick-action-icon" style={{ background: color }}>
        {Icon && <Icon />}
      </div>
      <div>
        <div className="quick-action-label">{label}</div>
        {description && <div className="quick-action-desc">{description}</div>}
      </div>
    </>
  );

  if (isModalTrigger) {
    return (
      <div 
        onClick={onClick} 
        className="quick-action-card animate-slide-up" 
        style={{ cursor: 'pointer' }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link to={path} className="quick-action-card animate-slide-up">
      {content}
    </Link>
  );
}
