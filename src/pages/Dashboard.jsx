import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import Header from '../components/Header'
import DayScroller from '../components/DayScroller'
import Stats from '../components/Stats'
import CustomerCard from '../components/CustomerCard'
import AddCustomerModal from '../components/Modals/AddCustomerModal'
import PaymentModal from '../components/Modals/PaymentModal'
import HistoryModal from '../components/Modals/HistoryModal'

export default function Dashboard() {
  // Day Scroller State
  const [currentDay, setCurrentDay] = useState(() => {
    return localStorage.getItem('bill_handler_day') || 'Mon'
  })
  
  // History Date State (Defaults to Today)
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0])
  
  const [customers, setCustomers] = useState([])
  const [bills, setBills] = useState([])
  
  const [dailyTransactions, setDailyTransactions] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // 1. Effect for Route Data (Customers/Bills)
  useEffect(() => {
    localStorage.setItem('bill_handler_day', currentDay)
    fetchRouteData()
    
    const sub = supabase.channel('public:data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchRouteData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
        fetchRouteData()
        fetchHistoryData() // Refresh history too if bills change
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [currentDay])

  // 2. Effect for History Data (Updates when Date changes)
  useEffect(() => {
    fetchHistoryData()
  }, [historyDate])

  async function fetchRouteData() {
    setLoading(true)
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('route_day', currentDay)
      .order('sr_no', { ascending: true })
    setCustomers(customersData || [])
    
    if (customersData && customersData.length > 0) {
      const ids = customersData.map(c => c.id)
      const { data: billsData } = await supabase.from('bills').select('*').in('customer_id', ids)
      setBills(billsData || [])
    } else {
      setBills([])
    }
    setLoading(false)
  }

  // New Separate Function for History
  async function fetchHistoryData() {
    const { data } = await supabase
      .from('bills')
      .select('*, customers(name)')
      .eq('date', historyDate) // Uses the selected history date
      .gt('paid_amount', 0)
    
    setDailyTransactions(data || [])
  }

  const getPendingAmount = (customerId) => {
    return bills
      .filter(b => b.customer_id === customerId)
      .reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
  }

  const totalPending = customers.reduce((sum, c) => sum + getPendingAmount(c.id), 0)
  
  // Calculate Total for the *Selected History Date*
  const totalCollected = dailyTransactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0)

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.mobile && c.mobile.includes(searchTerm))
  )

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowModal(true)
  }

  const handlePay = (customer) => {
    setSelectedCustomer(customer)
    setShowPayModal(true)
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
        <button className="btn-small" onClick={() => setShowHistory(true)} style={{ background: '#28a745' }}>
          💰 <span className="btn-text">Payment</span>
        </button>
        <button className="btn-small" onClick={exportToExcel} style={{ background: '#667eea' }}>
          📊 <span className="btn-text">Export</span>
        </button>
        <button className="btn-small" onClick={() => window.location.reload()} style={{ background: '#333' }}>
          🔄 <span className="btn-text">Refresh</span>
        </button>
      </Header>
      
      <DayScroller currentDay={currentDay} onDayChange={setCurrentDay} />
      
      <div className="search-container">
        <input type="text" placeholder="🔍 Search Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* Note: 'collected' here now shows the total for the SELECTED history date, usually today */}
        <Stats count={filteredCustomers.length} pending={totalPending} collected={totalCollected} />
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found for {currentDay}.</p>
            <button className="btn-small" onClick={handleAddNew} style={{ marginTop: 15 }}>
              + Add Customer
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>Sr.</th>
                <th>Name</th>
                <th>Mobile</th>
                <th style={{ width: 80 }}>Pending</th>
                <th style={{ width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  pending={getPendingAmount(customer.id)}
                  onEdit={() => handleEditCustomer(customer)}
                  onPay={() => handlePay(customer)}
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
        onSuccess={fetchRouteData} 
        editCustomer={editingCustomer} 
        defaultDay={currentDay}
      />
      
      <PaymentModal 
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onSuccess={() => { fetchRouteData(); fetchHistoryData(); }}
        customer={selectedCustomer}
      />

      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        transactions={dailyTransactions}
        selectedDate={historyDate}
        onDateChange={setHistoryDate}
      />
    </div>
  )
}