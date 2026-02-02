import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import Header from '../components/Header'
import DayScroller from '../components/DayScroller'
import Stats from '../components/Stats'
import CustomerCard from '../components/CustomerCard'
import AddCustomerModal from '../components/Modals/AddCustomerModal'

export default function Dashboard() {
  const [currentDay, setCurrentDay] = useState('Mon')
  const [customers, setCustomers] = useState([])
  const [bills, setBills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    
    // Real-time subscription
    const subscription = supabase
      .channel('customers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentDay])

  async function fetchData() {
    setLoading(true)
    
    // Fetch customers for current day
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('route_day', currentDay)
      .order('sr_no', { ascending: true })
    
    setCustomers(customersData || [])
    
    // Fetch all bills for calculations
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

  // Export to Excel
  const exportToExcel = async () => {
    const allCustomers = await supabase.from('customers').select('*')
    const allBills = await supabase.from('bills').select('*')
    
    const data = allCustomers.data.map(c => {
      const custBills = allBills.data.filter(b => b.customer_id === c.id)
      const pending = custBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0)
      return {
        'Serial': c.sr_no,
        'Name': c.name,
        'Mobile': c.mobile,
        'Route': c.route_day,
        'Pending': pending
      }
    })
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Customers")
    XLSX.writeFile(wb, `Route_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Backup
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

  // Restore
  const restoreData = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = JSON.parse(e.target.result)
      if (confirm(`Restore ${data.customers?.length} customers?`)) {
        for (const c of data.customers) {
          delete c.id
          await supabase.from('customers').insert([c])
        }
        for (const b of data.bills) {
          delete b.id
          await supabase.from('bills').insert([b])
        }
        fetchData()
        alert('Restored!')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <Header>
        {/* Export Button */}
        <button className="btn-small" onClick={exportToExcel} style={{ background: '#667eea' }} title="Export to Excel">
          📊 <span className="btn-text">Export</span>
        </button>
        
        {/* Backup Button */}
        <button className="btn-small" onClick={backupData} title="Backup Data">
          💾 <span className="btn-text">Backup</span>
        </button>
        
        {/* Restore Button */}
        <label className="btn-small" style={{ cursor: 'pointer' }} title="Restore Data">
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
            <button className="btn-small" onClick={() => setShowModal(true)} style={{ marginTop: 10 }}>
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
                <th style={{ width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  pending={getPendingAmount(customer.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="fab-btn" onClick={() => setShowModal(true)}>+</button>
      
      <AddCustomerModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}