import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import Header from '../components/Header'
import DayScroller from '../components/DayScroller'
import Stats from '../components/Stats'
import CustomerCard from '../components/CustomerCard'
import AddCustomerModal from '../components/Modals/AddCustomerModal'

export default function Dashboard() {
  // FIX 1: Load day from LocalStorage (Memory) so it never resets to Mon automatically
  const [currentDay, setCurrentDay] = useState(() => {
    return localStorage.getItem('bill_handler_day') || 'Mon'
  })
  
  const [customers, setCustomers] = useState([])
  const [bills, setBills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    // FIX 2: Save the day whenever it changes
    localStorage.setItem('bill_handler_day', currentDay)
    
    fetchData()
    
    const subscription = supabase
      .channel('public:data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchData)
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [currentDay])

  async function fetchData() {
    setLoading(true)
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('route_day', currentDay)
      .order('sr_no', { ascending: true })
    
    setCustomers(customersData || [])
    
    if (customersData && customersData.length > 0) {
      const ids = customersData.map(c => c.id)
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .in('customer_id', ids)
      setBills(billsData || [])
    } else {
      setBills([])
    }
    setLoading(false)
  }

  const getPendingAmount = (customerId) => {
    return bills
      .filter(b => b.customer_id === customerId)
      .reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
  }

  const totalPending = customers.reduce((sum, c) => sum + getPendingAmount(c.id), 0)

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.mobile && c.mobile.includes(searchTerm))
  )

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowModal(true)
  }

  const handleAddNew = () => {
    setEditingCustomer(null)
    setShowModal(true)
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers.map(c => ({
      Serial: c.sr_no, Name: c.name, Mobile: c.mobile, Pending: getPendingAmount(c.id)
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Route")
    XLSX.writeFile(wb, `Report_${currentDay}.xlsx`)
  }

  return (
    <div>
      <Header>
        <button className="btn-small" onClick={exportToExcel} style={{ background: '#667eea' }}>
          📊 <span className="btn-text">Export</span>
        </button>
        <button className="btn-small" onClick={() => window.location.reload()}>
          🔄 <span className="btn-text">Refresh</span>
        </button>
      </Header>
      
      <DayScroller currentDay={currentDay} onDayChange={setCurrentDay} />
      
      <div className="search-container">
        <input 
          type="text" 
          placeholder="🔍 Search Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="container">
        <Stats count={filteredCustomers.length} pending={totalPending} />
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found for {currentDay}.</p>
            <button className="btn-small" onClick={handleAddNew} style={{ marginTop: 15 }}>
              + Add Customer to {currentDay}
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sr.</th>
                <th>Name</th>
                <th>Mobile</th>
                <th style={{ width: 80 }}>Pending</th>
                <th style={{ width: 70 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  pending={getPendingAmount(customer.id)}
                  onEdit={() => handleEditCustomer(customer)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="fab-btn" onClick={handleAddNew}>+</button>
      
      <AddCustomerModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onSuccess={fetchData}
        editCustomer={editingCustomer}
        defaultDay={currentDay} /* FIX 3: Pass the current day to the modal */
      />
    </div>
  )
}