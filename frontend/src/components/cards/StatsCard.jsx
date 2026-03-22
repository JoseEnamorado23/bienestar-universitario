export default function StatsCard({ label, value, icon: Icon, color, change }) {
  return (
    <div className="stat-card animate-slide-up" style={{ '--stat-color': color }}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon" style={{ background: color }}>
            <Icon />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {change && <div className="stat-card-change">{change}</div>}
    </div>
  );
}
