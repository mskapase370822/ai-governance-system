export function StatsCard({ title, value, icon: Icon, color = "blue" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
      {Icon && (
        <div className={`stat-card-icon ${color}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}