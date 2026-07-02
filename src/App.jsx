import { useState } from 'react'
import SignupPage from './pages/SignupPage.jsx'

export default function App() {
  const [page, setPage] = useState('signup')
  const [user, setUser] = useState(null)

  if (page === 'signup') {
    return (
      <SignupPage
        onSuccess={(data) => {
          setUser(data.user)
          setPage('home')
        }}
        goToLogin={() => setPage('login')}
      />
    )
  }

  if (page === 'home') {
    return <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>Compte créé ✅ — bienvenue sur GainPay</div>
  }

  return <div style={{ padding: 24 }}>Page de connexion à venir</div>
}
