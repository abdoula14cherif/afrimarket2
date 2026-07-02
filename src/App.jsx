import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import PublishPage from './pages/PublishPage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import ContactsPage from './pages/ContactsPage.jsx'
import MyListingsPage from './pages/MyListingsPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'

export default function App() {
  const [page, setPage] = useState('signup')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        navigateTo('dashboard', { replace: true })
      } else {
        navigateTo('signup', { replace: true })
      }
      setCheckingSession(false)
    }
    restoreSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) { setProfile(null); return }
      const { data } = await supabase.from('profiles').select('numero').eq('id', user.id).single()
      setProfile(data)
    }
    loadProfile()
  }, [user])

  function navigateTo(dest, { replace = false } = {}) {
    setPage(dest)
    if (replace) window.history.replaceState({ page: dest }, '', '')
    else window.history.pushState({ page: dest }, '', '')
  }

  useEffect(() => {
    function handlePopState(event) {
      setPage(event.state?.page || 'dashboard')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (checkingSession) {
    return <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>Chargement...</div>
  }

  if (page === 'signup') return <SignupPage onSuccess={(data) => { setUser(data.user); navigateTo('dashboard') }} goToLogin={() => navigateTo('login')} />
  if (page === 'login') return <LoginPage onSuccess={(data) => { setUser(data.user); navigateTo('dashboard') }} goToSignup={() => navigateTo('signup')} />
  if (page === 'dashboard') return <DashboardPage user={user} onNavigate={(dest) => navigateTo(dest)} onLogout={() => { setUser(null); navigateTo('login') }} />
  if (page === 'profile') return <ProfilePage user={user} onNavigate={(dest) => navigateTo(dest)} onLogout={() => { setUser(null); navigateTo('login') }} />
  if (page === 'publish') return <PublishPage user={user} profile={profile} editId={editId} onNavigate={(dest) => { setEditId(null); navigateTo(dest) }} />
  if (page === 'explore') return <ExplorePage user={user} onNavigate={(dest) => navigateTo(dest)} />
  if (page === 'contacts') return <ContactsPage user={user} onNavigate={(dest) => navigateTo(dest)} />
  if (page === 'favoris') return <FavoritesPage user={user} onNavigate={(dest) => navigateTo(dest)} />

  if (page === 'my-listings') {
    return (
      <MyListingsPage
        user={user}
        onNavigate={(dest) => navigateTo(dest)}
        onEdit={(id) => { setEditId(id); navigateTo('publish') }}
      />
    )
  }

  return <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>Page "{page}" à venir</div>
}
