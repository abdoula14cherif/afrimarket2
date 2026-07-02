import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function DashboardPage({ user, onNavigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [annoncesCount, setAnnoncesCount] = useState(0)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
      const { data } = await supabase.from('profiles').select('prenom, nom, entreprise').eq('id', user.id).single()
      setProfile(data)

      const { count } = await supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      setAnnoncesCount(count || 0)

      setLoading(false)
    }
    loadProfile()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout?.()
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.topRow}>
          <div style={styles.brand}>Gain<span style={{ color: COLORS.marigold }}>Pay</span></div>
          <span style={styles.logout} onClick={handleLogout}>Déconnexion</span>
        </div>
        <p style={styles.greeting}>{loading ? 'Chargement...' : `Salut ${profile?.prenom || ''} 👋`}</p>
        {profile?.entreprise && <p style={styles.entreprise}>{profile.entreprise}</p>}
      </div>

      <div style={styles.stats}>
        <StatCard label="Annonces publiées" value={String(annoncesCount)} color={COLORS.indigo} />
        <StatCard label="Contacts reçus" value="0" color={COLORS.terracotta} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Commence ici</h2>
        <ActionCard icon="📢" title="Publier ta première annonce" subtitle="Produit ou service, en 2 minutes" onClick={() => onNavigate?.('publish')} />
        <ActionCard icon="🔍" title="Explorer la marketplace" subtitle="Vois ce que les autres proposent" onClick={() => onNavigate?.('explore')} />
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, subtitle, onClick }) {
  return (
    <div style={styles.actionCard} onClick={onClick}>
      <span style={styles.actionIcon}>{icon}</span>
      <div>
        <div style={styles.actionTitle}>{title}</div>
        <div style={styles.actionSubtitle}>{subtitle}</div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 32px', borderRadius: '0 0 28px 28px', color: '#fff' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22 },
  logout: { fontSize: 12, color: '#E4E1F2', cursor: 'pointer', textDecoration: 'underline' },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, marginTop: 16, marginBottom: 2 },
  entreprise: { fontSize: 13, color: '#E4E1F2', margin: 0 },
  stats: { display: 'flex', gap: 12, padding: '18px 20px 0' },
  statCard: { flex: 1, background: COLORS.card, borderRadius: 14, padding: '14px 16px', boxShadow: '0 4px 14px rgba(43,37,96,0.08)' },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700 },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  section: { padding: '22px 20px' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, margin: '0 0 12px' },
  actionCard: { display: 'flex', alignItems: 'center', gap: 14, background: COLORS.card, borderRadius: 14, padding: '14px 16px', marginBottom: 12, boxShadow: '0 4px 14px rgba(43,37,96,0.06)', cursor: 'pointer' },
  actionIcon: { fontSize: 26 },
  actionTitle: { fontSize: 14, fontWeight: 700, color: COLORS.ink },
  actionSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
}
