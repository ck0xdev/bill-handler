import { useNavigate, useLocation } from 'react-router-dom'

export default function Header({ children, title = "Daily Route" }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDetails = location.pathname.includes('/customer/')

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
            <h1>{title}</h1>
            <div className="header-actions">
              {children}
            </div>
          </>
        )}
      </div>
    </header>
  )
}