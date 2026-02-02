export default function HistoryModal({ isOpen, onClose, date, transactions }) {
  if (!isOpen) return null

  const total = transactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0)

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Daily Collection</h2>
        <p style={{color:'#666', fontSize:'0.9rem', marginBottom: '15px'}}>
          Date: <strong>{date}</strong>
        </p>
        
        <div className="history-list">
          {transactions.length === 0 ? (
            <p style={{textAlign:'center', padding:20, color:'#999'}}>No payments received today.</p>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="history-item">
                <div style={{display:'flex', flexDirection:'column'}}>
                  <span>{t.customers?.name || 'Unknown'}</span>
                  <small style={{color:'#999'}}>Bill #{t.bill_no}</small>
                </div>
                <span className="history-amount">+₹{t.paid_amount}</span>
              </div>
            ))
          )}
        </div>

        <div style={{
          marginTop: 20, 
          paddingTop: 15, 
          borderTop:'2px dashed #eee', 
          display:'flex', 
          justifyContent:'space-between', 
          fontSize:'1.2rem', 
          fontWeight:'bold'
        }}>
          <span>Total:</span>
          <span style={{color:'#3182ce'}}>₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}