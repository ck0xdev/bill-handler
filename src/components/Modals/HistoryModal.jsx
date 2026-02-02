export default function HistoryModal({ isOpen, onClose, selectedDate, onDateChange, transactions }) {
  if (!isOpen) return null

  const total = transactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0)

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Collection History</h2>
        
        {/* Date Picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.9rem', color: '#666' }}>Select Date:</label>
          <input 
            type="date" 
            className="input-field" 
            style={{ margin: '5px 0 0 0', padding: '10px' }}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        
        <div className="history-list">
          {transactions.length === 0 ? (
            <p style={{textAlign:'center', padding:20, color:'#999'}}>
              No payments found for this date.
            </p>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="history-item">
                <div style={{display:'flex', flexDirection:'column'}}>
                  <span>{t.customers?.name || 'Unknown'}</span>
                  <small style={{color:'#999'}}>
                    {t.bill_no === 'PAY' ? 'Direct Payment' : `Bill #${t.bill_no}`}
                  </small>
                </div>
                <span className="history-amount">+₹{t.paid_amount.toLocaleString()}</span>
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