import { useState } from 'react'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

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

  if (page === 'login') {
    return (
      <LoginPage
        onSuccess={(data) => {
          setUser(data.user)
          setPage('home')
        }}
        goToSignup={() => setPage('signup')}
      />
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      Connecté ✅ — bienvenue sur GainPay, {user?.email}
    </div>
  )
}
