import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    route_day: 'Mon',
    sr_no: ''
  })
  const [loading, setLoading] = useState(false)

  // Full names for dropdown
  const days = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' }
  ]

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('customers')
      .insert([{
        name: formData.name,
        mobile: formData.mobile,
        route_day: formData.route_day,
        sr_no: parseInt(formData.sr_no) || 0
      }])

    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      setFormData({ name: '', mobile: '', route_day: 'Mon', sr_no: '' })
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <label>Route Day:</label>
          <select 
            className="input-field"
            value={formData.route_day}
            onChange={(e) => setFormData({...formData, route_day: e.target.value})}
            required
          >
            {days.map(day => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
          
          <label>Serial No:</label>
          <input 
            type="number" 
            className="input-field"
            placeholder="e.g. 1"
            value={formData.sr_no}
            onChange={(e) => setFormData({...formData, sr_no: e.target.value})}
            required
          />
          
          <label>Customer Name:</label>
          <input 
            type="text" 
            className="input-field"
            placeholder="Enter Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          
          <label>Mobile No:</label>
          <input 
            type="tel" 
            className="input-field"
            placeholder="Enter Mobile"
            value={formData.mobile}
            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
          />
          
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
      </div>
    </div>
  )
}