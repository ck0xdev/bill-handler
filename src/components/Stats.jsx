export default function Stats({ count, pending }) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-number">{count}</span>
        <span className="stat-label">Customers</span>
      </div>
      <div className="stat-item">
        <span className="stat-number" style={{ color: pending > 0 ? '#dc3545' : '#28a745' }}>
          ₹{pending.toLocaleString()}
        </span>
        <span className="stat-label">Total Pending</span>
      </div>
    </div>
  )
}