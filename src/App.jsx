import { useState } from 'react'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import PublishPage from './pages/PublishPage.jsx'

export default function App() {
  const [page, setPage] = useState('signup')
  const [user, setUser] = useState(null)

  if (page === 'signup') {
    return <SignupPage onSuccess={(data) => { setUser(data.user); setPage('dashboard') }} goToLogin={() => setPage('login')} />
  }
  if (page === 'login') {
    return <LoginPage onSuccess={(data) => { setUser(data.user); setPage('dashboard') }} goToSignup={() => setPage('signup')} />
  }
  if (page === 'dashboard') {
    return <DashboardPage user={user} onNavigate={(dest) => setPage(dest)} onLogout={() => { setUser(null); setPage('login') }} />
  }
  if (page === 'profile') {
    return <ProfilePage user={user} onNavigate={(dest) => setPage(dest)} onLogout={() => { setUser(null); setPage('login') }} />
  }
  if (page === 'publish') {
    return <PublishPage user={user} onNavigate={(dest) => setPage(dest)} />
  }

  return <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>Page "{page}" à venir</div>
}
