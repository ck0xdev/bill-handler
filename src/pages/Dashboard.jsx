import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import Header from '../components/Header'
import DayScroller from '../components/DayScroller'
import Stats from '../components/Stats'
import CustomerCard from '../components/CustomerCard'
import AddCustomerModal from '../components/Modals/AddCustomerModal'

export default function Dashboard() {
  // FIX 1: Initialize state from LocalStorage so it remembers the day on reload
  const [currentDay, setCurrentDay] = useState(() => {
    return localStorage.getItem('bill_handler_day') || 'Mon'
  })
  
  const [customers, setCustomers] = useState([])
  const [bills, setBills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // New state for editing
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    // FIX 1: Save day to LocalStorage whenever it changes
    localStorage.setItem('bill_handler_day', currentDay)
    
    fetchData()
    
    const subscription = supabase
      .channel('customers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchData)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
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
    const customerBills = bills.filter(b => b.customer_id === customerId)
    return customerBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
  }

  const totalPending = customers.reduce((sum, c) => sum + getPendingAmount(c.id), 0)

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.mobile && c.mobile.includes(searchTerm))
  )

  // FIX 2: Handler to open modal with customer data
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowModal(true)
  }

  const handleAddNew = () => {
    setEditingCustomer(null) // Clear edit data for new entry
    setShowModal(true)
  }

  // ... (Export, Backup, Restore functions remain the same) ...
  const exportToExcel = async () => {
    const allCustomers = await supabase.from('customers').select('*')
    const allBills = await supabase.from('bills').select('*')
    const data = allCustomers.data.map(c => {
      const custBills = allBills.data.filter(b => b.customer_id === c.id)
      const pending = custBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
      return { 'Serial': c.sr_no, 'Name': c.name, 'Mobile': c.mobile, 'Route': c.route_day, 'Pending': pending }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Customers")
    XLSX.writeFile(wb, `Route_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const backupData = async () => {
    const { data: cust } = await supabase.from('customers').select('*')
    const { data: bill } = await supabase.from('bills').select('*')
    const backup = { customers: cust, bills: bill, date: new Date().toISOString() }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `backup_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const restoreData = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = JSON.parse(e.target.result)
      if (confirm(`Restore ${data.customers?.length} customers?`)) {
        for (const c of data.customers) { delete c.id; await supabase.from('customers').insert([c]) }
        for (const b of data.bills) { delete b.id; await supabase.from('bills').insert([b]) }
        fetchData()
        alert('Restored!')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <Header>
        <button className="btn-small" onClick={exportToExcel} style={{ background: '#667eea' }}>
          📊 <span className="btn-text">Export</span>
        </button>
        <button className="btn-small" onClick={backupData}>
          💾 <span className="btn-text">Backup</span>
        </button>
        <label className="btn-small" style={{ cursor: 'pointer' }}>
          🔄 <span className="btn-text">Restore</span>
          <input type="file" style={{ display: 'none' }} onChange={restoreData} accept=".json" />
        </label>
      </Header>
      
      <DayScroller currentDay={currentDay} onDayChange={setCurrentDay} />
      
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search by Name or Mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <Stats count={filteredCustomers.length} pending={totalPending} />
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found for {currentDay}</p>
            <button className="btn-small" onClick={handleAddNew} style={{ marginTop: 10 }}>
              Add First Customer
            </button>
          </div>
        ) : (
          <table id="shopperTable">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sr.</th>
                <th>Name</th>
                <th>Mobile</th>
                <th style={{ width: 80 }}>Pending</th>
                <th style={{ width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  pending={getPendingAmount(customer.id)}
                  onEdit={() => handleEditCustomer(customer)} // Pass edit handler
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
        editCustomer={editingCustomer} // Pass the customer to edit
      />
    </div>
  )
}