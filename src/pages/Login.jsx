import { useState } from 'react'

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  // --- YOUR SECRET CREDENTIALS ---
  const COMMON_ID = "btkukadiya"
  const COMMON_PASS = "Bhavesh_1980" 
  // -------------------------------

  const handleLogin = (e) => {
    e.preventDefault()
    if (id === COMMON_ID && pass === COMMON_PASS) {
      onLogin() // Unlock the app
    } else {
      setError('Invalid Username or Password')
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px 30px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '350px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
        <h2 style={{margin: '0 0 20px 0', color: '#333'}}>Bill Handler Pro</h2>
        
        {error && (
          <div style={{
            background: '#ffe3e6', color: '#dc3545', 
            padding: '10px', borderRadius: '8px', 
            fontSize:'0.9rem', marginBottom:'20px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={id}
            onChange={e => setId(e.target.value)}
            style={{
              width: '100%', padding: '14px', marginBottom: '15px',
              border: '2px solid #eee', borderRadius: '10px', fontSize:'16px', outline: 'none'
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={pass}
            onChange={e => setPass(e.target.value)}
            style={{
              width: '100%', padding: '14px', marginBottom: '25px',
              border: '2px solid #eee', borderRadius: '10px', fontSize:'16px', outline: 'none'
            }}
          />
          <button type="submit" style={{
            width: '100%', padding: '14px',
            background: '#667eea', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            transition: 'transform 0.1s'
          }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}