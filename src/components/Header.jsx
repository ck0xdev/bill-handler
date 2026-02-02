import { useNavigate, useLocation } from 'react-router-dom'

export default function Header({ children, title = "Daily Route" }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDetails = location.pathname.includes('/customer/')

  const handleLogout = () => {
    if(confirm("Lock the application?")) {
      // Clear both the Auth key AND the Expiration key
      localStorage.removeItem('bill_handler_auth')
      localStorage.removeItem('bill_handler_expiry')
      
      window.location.reload()
    }
  }

  return (
    <header className={isDetails ? 'details-header' : ''}>
      <div className="top-bar">
        {isDetails ? (
          <>
            <button onClick={() => navigate('/')} className="back-btn">← Back</button>
            <h1>{title}</h1>
            <div style={{ width: 60 }}></div>
          </>
        ) : (
          <>
            <div style={{display:'flex', alignItems:'center', gap: 10}}>
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'rgba(0,0,0,0.2)', 
                  border:'none', 
                  color:'white', 
                  borderRadius:'8px', 
                  width:36, 
                  height:36, 
                  cursor:'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Lock App"
              >
                🔒
              </button>
              <h1>{title}</h1>
            </div>
            <div className="header-actions">
              {children}
            </div>
          </>
        )}
      </div>
    </header>
  )
}