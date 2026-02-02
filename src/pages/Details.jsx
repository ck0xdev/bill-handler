import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import BillCard from '../components/BillCard'
import BillModal from '../components/Modals/BillModals'

export default function Details() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [bills, setBills] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)

  useEffect(() => {
    fetchCustomer()
    fetchBills()
  }, [id])

  async function fetchCustomer() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setCustomer(data)
  }

  async function fetchBills() {
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('customer_id', id)
      .order('date', { ascending: false })
    setBills(data || [])
  }

  const totalPending = bills.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
  
  const handleEdit = (bill) => {
    setEditingBill(bill)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBill(null)
  }

  const printStatement = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    const rows = bills.map(b => {
      const bal = parseFloat(b.total_amount) - parseFloat(b.paid_amount)
      return `<tr>
        <td style="border:1px solid #ddd;padding:8px">${b.bill_no}</td>
        <td style="border:1px solid #ddd;padding:8px">${new Date(b.date).toLocaleDateString()}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">₹${parseFloat(b.total_amount).toLocaleString()}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">₹${parseFloat(b.paid_amount).toLocaleString()}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">₹${bal.toLocaleString()}</td>
      </tr>`
    }).join('')
    
    printWindow.document.write(`
      <html>
      <head><title>Statement - ${customer?.name}</title></head>
      <body style="font-family:Arial;padding:20px">
        <h2 style="color:#667eea;text-align:center">CUSTOMER STATEMENT</h2>
        <p><strong>Customer:</strong> ${customer?.name}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <thead style="background:#667eea;color:white">
            <tr>
              <th style="padding:10px;text-align:left">Bill No</th>
              <th style="padding:10px;text-align:left">Date</th>
              <th style="padding:10px;text-align:right">Total</th>
              <th style="padding:10px;text-align:right">Paid</th>
              <th style="padding:10px;text-align:right">Balance</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:right;margin-top:20px;font-size:1.3em;color:#dc3545;font-weight:bold">
          Total Pending: ₹${totalPending.toLocaleString()}
        </div>
        <button onclick="window.print()" style="display:block;margin:20px auto;padding:10px 20px;background:#667eea;color:white;border:none;cursor:pointer">
          Print Now
        </button>
      </body>
      </html>
    `)
  }

  if (!customer) return <div>Loading...</div>

  return (
    <div>
      <Header title={customer.name} />
      
      <div className="details-header" style={{ marginTop: -60, paddingTop: 80 }}>
        <div className="meta-info" style={{ marginTop: 10 }}>
          <span>Sr: {customer.sr_no}</span> | 
          <span><a href={`tel:${customer.mobile}`} style={{color:'white'}}>📞 Call</a></span> | 
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>
            {customer.route_day}
          </span>
        </div>
      </div>

      <div className="summary-card">
        <h3>Total Pending Amount</h3>
        <h1 className={totalPending > 0 ? 'amount-red' : 'amount-green'} style={{ fontSize: '2.5rem' }}>
          ₹ {totalPending.toLocaleString()}
        </h1>
        {bills.length > 0 && (
          <p style={{ color: '#666', marginTop: 5 }}>
            Last: {bills[0].bill_no} on {new Date(bills[0].date).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="container">
        <div className="section-header">
          <h3>Bill History</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-small" onClick={printStatement} style={{ background: '#6c757d' }}>
              🖨️ Print
            </button>
            <button className="btn-small" onClick={() => setShowModal(true)}>
              + New Bill
            </button>
          </div>
        </div>

        {bills.length === 0 ? (
          <div className="empty-state">No bills yet. Add your first bill!</div>
        ) : (
          bills.map(bill => (
            <BillCard key={bill.id} bill={bill} onEdit={handleEdit} />
          ))
        )}
      </div>

      <BillModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={fetchBills}
        customerId={id}
        editBill={editingBill}
      />
    </div>
  )
}