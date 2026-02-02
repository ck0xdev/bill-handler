import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Details from './pages/Details'
import Login from './pages/Login'

function App() {
  // Initialize Auth State with Time Check
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('bill_handler_auth')
    const expiry = localStorage.getItem('bill_handler_expiry')
    
    // Check if logged in AND session is still valid (not expired)
    if (auth === 'true' && expiry) {
      const now = new Date().getTime()
      if (now < parseInt(expiry)) {
        return true // Still valid
      }
    }
    
    // If we get here, it's either invalid or expired
    localStorage.removeItem('bill_handler_auth')
    localStorage.removeItem('bill_handler_expiry')
    return false
  })

  const handleLogin = () => {
    const now = new Date().getTime()
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000 // 3 Days * 24h * 60m * 60s * 1000ms
    const expiryTime = now + threeDaysInMillis
    
    localStorage.setItem('bill_handler_auth', 'true')
    localStorage.setItem('bill_handler_expiry', expiryTime.toString())
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customer/:id" element={<Details />} />
      </Routes>
    </Router>
  )
}

export default App