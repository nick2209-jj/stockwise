export default function StatCard({ label, value, icon, color = "purple", foot = "Across your store", trend }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{trend ? <><span className="trend-up">{trend}</span><span>vs. last month</span></> : <span>{foot}</span>}</div>
    </article>
  );
}
