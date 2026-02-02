import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddCustomerModal({ isOpen, onClose, onSuccess, editCustomer = null, defaultDay = 'Mon' }) {
  const [formData, setFormData] = useState({
    name: '', mobile: '', route_day: defaultDay, sr_no: ''
  })
  const [loading, setLoading] = useState(false)

  const days = [
    { val: 'Mon', label: 'Monday' }, { val: 'Tue', label: 'Tuesday' },
    { val: 'Wed', label: 'Wednesday' }, { val: 'Thu', label: 'Thursday' },
    { val: 'Fri', label: 'Friday' }, { val: 'Sat', label: 'Saturday' },
    { val: 'Sun', label: 'Sunday' }
  ]

  // FIX 4: Update form when modal opens OR when defaultDay changes
  useEffect(() => {
    if (editCustomer) {
      setFormData({
        name: editCustomer.name,
        mobile: editCustomer.mobile || '',
        route_day: editCustomer.route_day,
        sr_no: editCustomer.sr_no
      })
    } else {
      // Use the defaultDay passed from Dashboard (e.g. 'Tue')
      setFormData({ name: '', mobile: '', route_day: defaultDay, sr_no: '' })
    }
  }, [editCustomer, isOpen, defaultDay])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const payload = {
      name: formData.name,
      mobile: formData.mobile,
      route_day: formData.route_day,
      sr_no: parseInt(formData.sr_no) || 0
    }

    let error
    if (editCustomer) {
      const { error: updateError } = await supabase.from('customers').update(payload).eq('id', editCustomer.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('customers').insert([payload])
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
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Route Day</label>
          <select 
            className="input-field" 
            value={formData.route_day}
            onChange={e => setFormData({...formData, route_day: e.target.value})}
          >
            {days.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>
          
          <label>Serial No.</label>
          <input 
            type="number" 
            className="input-field"
            value={formData.sr_no}
            onChange={e => setFormData({...formData, sr_no: e.target.value})}
            placeholder="Auto"
          />
          
          <label>Name</label>
          <input 
            type="text" 
            className="input-field"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Customer Name"
            required
          />
          
          <label>Mobile (Optional)</label>
          <input 
            type="tel" 
            className="input-field"
            value={formData.mobile}
            onChange={e => setFormData({...formData, mobile: e.target.value})}
            placeholder="Mobile Number"
          />
          
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : (editCustomer ? 'Update' : 'Save Customer')}
          </button>
        </form>
      </div>
    </div>
  )
}