import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function BillModal({ isOpen, onClose, onSuccess, customerId, editBill = null }) {
  const [formData, setFormData] = useState({
    bill_no: '',
    date: new Date().toISOString().split('T')[0],
    total_amount: '',
    paid_amount: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editBill) {
      setFormData({
        bill_no: editBill.bill_no,
        date: editBill.date,
        total_amount: editBill.total_amount,
        paid_amount: editBill.paid_amount
      })
    } else {
      setFormData({
        bill_no: '',
        date: new Date().toISOString().split('T')[0],
        total_amount: '',
        paid_amount: 0
      })
    }
  }, [editBill, isOpen])

  if (!isOpen) return null

  const balance = (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid_amount) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const billData = {
      customer_id: customerId,
      bill_no: formData.bill_no,
      date: formData.date,
      total_amount: parseFloat(formData.total_amount) || 0,
      paid_amount: parseFloat(formData.paid_amount) || 0
    }

    let error
    
    if (editBill) {
      const { error: updateError } = await supabase
        .from('bills')
        .update(billData)
        .eq('id', editBill.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('bills')
        .insert([billData])
      error = insertError
    }

    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>{editBill ? 'Edit Bill' : 'New Bill Entry'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Date:</label>
          <input 
            type="date" 
            className="input-field"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          
          <label>Bill Number:</label>
          <input 
            type="text" 
            className="input-field"
            placeholder="e.g. #101"
            value={formData.bill_no}
            onChange={(e) => setFormData({...formData, bill_no: e.target.value})}
            required
          />
          
          <label>Bill Amount (Total):</label>
          <input 
            type="number" 
            className="input-field"
            placeholder="0"
            value={formData.total_amount}
            onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
            required
          />
          
          <label>Amount Paid (Received):</label>
          <input 
            type="number" 
            className="input-field"
            placeholder="0"
            value={formData.paid_amount}
            onChange={(e) => setFormData({...formData, paid_amount: e.target.value})}
          />
          
          <div style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, margin: '10px 0' }}>
            <strong>Balance: <span style={{ color: balance > 0 ? '#dc3545' : '#28a745' }}>
              ₹{balance.toLocaleString()}
            </span></strong>
          </div>
          
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}