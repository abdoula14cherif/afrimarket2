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
import VerificationPage from './pages/VerificationPage.jsx'
import AnnonceDetailPage from './pages/AnnonceDetailPage.jsx'
import LegalPage from './pages/LegalPage.jsx'
import BoutiqueSettingsPage from './pages/BoutiqueSettingsPage.jsx'
import BoutiquePage from './pages/BoutiquePage.jsx'

export default function App() {
  const [page, setPage] = useState('signup')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [editId, setEditId] = useState(null)
  const [selectedAnnonceId, setSelectedAnnonceId] = useState(null)
  const [selectedBoutiqueSlug, setSelectedBoutiqueSlug] = useState(null)

  useEffect(() => {
    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setUser(session.user)

      const params = new URLSearchParams(window.location.search)
      const annonceParam = params.get('annonce')
      const boutiqueParam = params.get('boutique')

      if (annonceParam) {
        navigateTo('annonce-detail', annonceParam, { replace: true })
      } else if (boutiqueParam) {
        navigateTo('boutique', boutiqueParam, { replace: true })
      } else if (session?.user) {
        navigateTo('dashboard', null, { replace: true })
      } else {
        navigateTo('signup', null, { replace: true })
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

  function navigateTo(dest, param = null, { replace = false } = {}) {
    setPage(dest)
    if (dest === 'annonce-detail') setSelectedAnnonceId(param)
    if (dest === 'boutique') setSelectedBoutiqueSlug(param)
    if (replace) window.history.replaceState({ page: dest, param }, '', '')
    else window.history.pushState({ page: dest, param }, '', '')
  }

  useEffect(() => {
    function handlePopState(event) {
      const dest = event.state?.page || 'dashboard'
      setPage(dest)
      if (dest === 'annonce-detail') setSelectedAnnonceId(event.state?.param || null)
      if (dest === 'boutique') setSelectedBoutiqueSlug(event.state?.param || null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function handleNavigate(dest, param) {
    navigateTo(dest, param)
  }

  if (checkingSession) {
    return <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>Chargement...</div>
  }

  if (page === 'boutique') return <BoutiquePage slug={selectedBoutiqueSlug} onNavigate={handleNavigate} />
  if (page === 'annonce-detail') return <AnnonceDetailPage annonceId={selectedAnnonceId} user={user} onNavigate={handleNavigate} />

  if (!user) {
    if (page === 'login') return <LoginPage onSuccess={(data) => { setUser(data.user); navigateTo('dashboard') }} goToSignup={() => navigateTo('signup')} />
    return <SignupPage onSuccess={(data) => { setUser(data.user); navigateTo('dashboard') }} goToLogin={() => navigateTo('login')} />
  }

  if (page === 'dashboard') return <DashboardPage user={user} onNavigate={handleNavigate} onLogout={() => { setUser(null); navigateTo('login') }} />
  if (page === 'profile') return <ProfilePage user={user} onNavigate={handleNavigate} onLogout={() => { setUser(null); navigateTo('login') }} />
  if (page === 'publish') return <PublishPage user={user} profile={profile} editId={editId} onNavigate={(dest) => { setEditId(null); navigateTo(dest) }} />
  if (page === 'explore') return <ExplorePage user={user} onNavigate={handleNavigate} />
  if (page === 'contacts') return <ContactsPage user={user} onNavigate={handleNavigate} />
  if (page === 'favoris') return <FavoritesPage user={user} onNavigate={handleNavigate} />
  if (page === 'verification') return <VerificationPage user={user} onNavigate={handleNavigate} />
  if (page === 'legal') return <LegalPage onNavigate={handleNavigate} />
  if (page === 'boutique-settings') return <BoutiqueSettingsPage user={user} onNavigate={handleNavigate} />
  if (page === 'my-listings') {
    return (
      <MyListingsPage
        user={user}
        onNavigate={handleNavigate}
        onEdit={(id) => { setEditId(id); navigateTo('publish') }}
      />
    )
  }

  return <DashboardPage user={user} onNavigate={handleNavigate} onLogout={() => { setUser(null); navigateTo('login') }} />
}
