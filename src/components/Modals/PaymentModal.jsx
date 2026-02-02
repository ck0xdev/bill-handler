import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PaymentModal({ isOpen, onClose, onSuccess, customer }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !customer) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Create a "Credit" entry (Total 0, Paid Amount)
    const { error } = await supabase.from('bills').insert([{
      customer_id: customer.id,
      bill_no: 'PAY', // Special tag for payments
      date: new Date().toISOString().split('T')[0], // Always today's date for record keeping
      total_amount: 0,
      paid_amount: parseFloat(amount)
    }])

    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      setAmount('')
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2 style={{color: '#28a745'}}>Receive Payment</h2>
        <p style={{marginBottom: 20}}>From: <strong>{customer.name}</strong></p>
        
        <form onSubmit={handleSubmit}>
          <label>Amount Received (₹):</label>
          <input 
            type="number" 
            className="input-field"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />
          
          <button type="submit" className="btn-save" style={{background: '#28a745'}} disabled={loading}>
            {loading ? 'Saving...' : 'Confirm Payment'}
          </button>
        </form>
      </div>
    </div>
  )
}