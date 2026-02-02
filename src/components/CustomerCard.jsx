import { useNavigate } from 'react-router-dom'

export default function CustomerCard({ customer, pending }) {
  const navigate = useNavigate()
  
  return (
    <tr onClick={() => navigate(`/customer/${customer.id}`)} style={{ cursor: 'pointer' }}>
      <td className="sr-col">{customer.sr_no}</td>
      <td><strong>{customer.name}</strong></td>
      <td>{customer.mobile || '-'}</td>
      <td style={{ 
        color: pending > 0 ? '#dc3545' : '#28a745', 
        fontWeight: 'bold' 
      }}>
        ₹{pending.toLocaleString()}
      </td>
      <td>
        <button className="btn-view" onClick={(e) => {
          e.stopPropagation()
          navigate(`/customer/${customer.id}`)
        }}>
          View
        </button>
      </td>
    </tr>
  )
}