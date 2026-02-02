export default function BillCard({ bill, onEdit }) {
  const balance = bill.total_amount - bill.paid_amount
  const isPaid = balance === 0
  
  return (
    <div className="bill-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ color: '#667eea' }}>{bill.bill_no}</strong>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>
          {/* CHANGED: Added 'en-GB' for DD/MM/YYYY format */}
          {new Date(bill.date).toLocaleDateString('en-GB')}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div>Total: ₹{parseFloat(bill.total_amount).toLocaleString()}</div>
          <div style={{ color: '#28a745' }}>Paid: ₹{parseFloat(bill.paid_amount).toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isPaid ? (
            <span className="badge-paid">PAID ✅</span>
          ) : (
            <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Bal: ₹{balance.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <button 
        className="btn-edit" 
        onClick={() => onEdit(bill)}
        style={{ marginTop: 10, width: '100%' }}
      >
        ✎ Edit Bill
      </button>
    </div>
  )
}