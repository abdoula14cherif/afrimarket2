import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS, SHADOWS } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

const SHORTCUTS = [
  { icon: '📢', label: 'Publier', dest: 'publish' },
  { icon: '📦', label: 'Mes annonces', dest: 'my-listings' },
  { icon: '❤️', label: 'Favoris', dest: 'favoris' },
  { icon: '🎁', label: 'Parrainage', dest: 'parrainage' },
  { icon: '🎟️', label: 'Codes promo', dest: 'promo-codes' },
  { icon: '💰', label: 'Offres', dest: 'offres' },
  { icon: '🔍', label: 'Explorer', dest: 'explore' },
]

export default function DashboardPage({ user, onNavigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [annoncesCount, setAnnoncesCount] = useState(0)
  const [contactsCount, setContactsCount] = useState(0)
  const [featured, setFeatured] = useState([])
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      const { data } = await supabase.from('profiles').select('prenom, nom, entreprise').eq('id', user.id).single()
      setProfile(data)

      const { count } = await supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      setAnnoncesCount(count || 0)

      const { data: myAnnonces } = await supabase.from('annonces').select('id').eq('user_id', user.id)
      const myAnnonceIds = (myAnnonces || []).map((a) => a.id)
      if (myAnnonceIds.length > 0) {
        const { count: contactCount } = await supabase
          .from('contacts_log')
          .select('id', { count: 'exact', head: true })
          .in('annonce_id', myAnnonceIds)
        setContactsCount(contactCount || 0)
      } else {
        setContactsCount(0)
      }

      const { data: recent } = await supabase
        .from('annonces')
        .select('id, titre, prix, ville, photo_url, contact, categorie')
        .order('created_at', { ascending: false })
        .limit(4)
      setFeatured(recent || [])

      const seenKey = `gp_dash_welcome_${user.id}`
      if (!localStorage.getItem(seenKey)) {
        setShowWelcomeBanner(true)
      }

      setLoading(false)
    }
    loadData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout?.()
  }

  const handleContact = async (item) => {
    if (!item.contact) return
    await supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const dismissBanner = () => {
    if (user?.id) localStorage.setItem(`gp_dash_welcome_${user.id}`, '1')
    setShowWelcomeBanner(false)
  }

  const firstFeatured = featured[0]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.glow} />
        <div style={styles.topRow}>
          <div style={styles.brand}>Gain<span style={{ color: COLORS.marigold }}>Pay</span></div>
          <span style={styles.logout} onClick={handleLogout}>Déconnexion</span>
        </div>
        <p style={styles.greeting}>{loading ? 'Chargement...' : `Salut ${profile?.prenom || ''} 👋`}</p>
        {profile?.entreprise && <p style={styles.entreprise}>{profile.entreprise}</p>}
      </div>

      {showWelcomeBanner && firstFeatured && (
        <div style={styles.welcomeBanner}>
          <span style={styles.welcomeCloseBtn} onClick={dismissBanner}>✕</span>
          <p style={styles.welcomeTitle}>👋 Bienvenue sur GainPay !</p>
          <p style={styles.welcomeText}>Voici ce qui se vend en ce moment sur la marketplace :</p>
          <div style={styles.welcomeCard} onClick={() => onNavigate?.('annonce-detail', firstFeatured.id)}>
            <div style={styles.welcomeCardImg}>
              {firstFeatured.photo_url ? (
                <img src={firstFeatured.photo_url} alt={firstFeatured.titre} style={styles.welcomeCardImgTag} />
              ) : (
                <span style={styles.welcomeCardImgFallback}>{CATEGORY_EMOJI[firstFeatured.categorie] || '🛍️'}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.welcomeCardTitle}>{firstFeatured.titre}</p>
              <p style={styles.welcomeCardMeta}>📍 {firstFeatured.ville} · {firstFeatured.prix?.toLocaleString('fr-FR')} F</p>
            </div>
            <span style={styles.welcomeCardArrow}>→</span>
          </div>
        </div>
      )}

      <div style={styles.stats}>
        <StatCard label="Annonces publiées" value={String(annoncesCount)} color={COLORS.indigo} onClick={() => onNavigate?.('my-listings')} delay={0} />
        <StatCard label="Contacts reçus" value={String(contactsCount)} color={COLORS.terracotta} delay={60} />
      </div>

      <div style={styles.shortcutsRow}>
        {SHORTCUTS.map((s, i) => (
          <div key={s.dest} style={{ ...styles.shortcutItem, animation: `gp-fade-up 0.4s ease ${i * 40}ms both` }} onClick={() => onNavigate?.(s.dest)}>
            <div style={styles.shortcutIcon}>{s.icon}</div>
            <span style={styles.shortcutLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeadRow}>
          <h2 style={styles.sectionTitle}>Annonces en vedette</h2>
          <span style={styles.seeAll} onClick={() => onNavigate?.('explore')}>Tout voir</span>
        </div>
        {!loading && featured.length === 0 && <p style={styles.emptyText}>Aucune annonce pour l'instant — sois le premier à publier !</p>}
        <div style={styles.grid}>
          {featured.map((item, i) => (
            <div
              key={item.id}
              style={{ ...styles.card, animation: `gp-fade-up 0.5s ease ${i * 70}ms both` }}
              onClick={() => onNavigate?.('annonce-detail', item.id)}
            >
              <div style={styles.cardImg}>
                {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
                <div style={styles.cardImgShine} />
              </div>
              <div style={styles.cardBody}>
                <p style={styles.cardTitle}>{item.titre}</p>
                <p style={styles.cardLoc}>📍 {item.ville}</p>
                <span style={styles.priceTag}>{item.prix?.toLocaleString('fr-FR')} F</span>
                <button style={styles.contactBtn} onClick={(e) => { e.stopPropagation(); handleContact(item) }}>💬 Contacter</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

function StatCard({ label, value, color, onClick, delay }) {
  return (
    <div style={{ ...styles.statCard, cursor: onClick ? 'pointer' : 'default', animation: `gp-fade-up 0.5s ease ${delay}ms both` }} onClick={onClick}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: GRADIENTS.hero, padding: '30px 20px 36px', borderRadius: '0 0 32px 32px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: SHADOWS.lifted },
  glow: { position: 'absolute', inset: 0, background: GRADIENTS.marigoldGlow, animation: 'gp-glow 4s ease-in-out infinite' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 23, letterSpacing: '-0.3px' },
  logout: { fontSize: 12, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', textDecoration: 'underline' },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, marginTop: 18, marginBottom: 2, position: 'relative' },
  entreprise: { fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, position: 'relative' },
  welcomeBanner: {
    background: COLORS.card, margin: '16px 20px 0', borderRadius: 18, padding: '16px 18px 18px',
    boxShadow: SHADOWS.lifted, position: 'relative', animation: 'gp-fade-up 0.4s ease both',
  },
  welcomeCloseBtn: { position: 'absolute', top: 12, right: 14, fontSize: 13, fontWeight: 700, color: COLORS.muted, cursor: 'pointer' },
  welcomeTitle: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 22px 4px 0' },
  welcomeText: { fontSize: 12, color: COLORS.muted, margin: '0 0 12px' },
  welcomeCard: { display: 'flex', alignItems: 'center', gap: 12, background: COLORS.sand, borderRadius: 14, padding: '10px 12px', cursor: 'pointer' },
  welcomeCardImg: { width: 52, height: 52, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  welcomeCardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  welcomeCardImgFallback: { fontSize: 24 },
  welcomeCardTitle: { fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: 0 },
  welcomeCardMeta: { fontSize: 11, color: COLORS.muted, margin: '2px 0 0' },
  welcomeCardArrow: { fontSize: 16, fontWeight: 700, color: COLORS.indigo },
  stats: { display: 'flex', gap: 12, padding: '18px 20px 0', marginTop: -14 },
  statCard: { flex: 1, background: COLORS.card, borderRadius: 16, padding: '15px 16px', boxShadow: SHADOWS.lifted },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 25, fontWeight: 700 },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  shortcutsRow: { display: 'flex', gap: 14, padding: '20px 20px 6px', overflowX: 'auto' },
  shortcutItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto', cursor: 'pointer', width: 66 },
  shortcutIcon: { width: 54, height: 54, borderRadius: 16, background: COLORS.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: SHADOWS.soft },
  shortcutLabel: { fontSize: 10.5, fontWeight: 600, color: COLORS.ink, textAlign: 'center', lineHeight: 1.2 },
  section: { padding: '20px 20px 4px' },
  sectionHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, margin: '0 0 14px', color: COLORS.ink },
  seeAll: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft, cursor: 'pointer' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingBottom: 10 },
  card: { background: COLORS.card, borderRadius: 18, overflow: 'hidden', boxShadow: SHADOWS.soft, cursor: 'pointer' },
  cardImg: { height: 105, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 32 },
  cardImgShine: { position: 'absolute', inset: 0, background: GRADIENTS.cardShine },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34 },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  contactBtn: { display: 'block', width: '100%', marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '9px 0', borderRadius: 10, cursor: 'pointer', boxShadow: SHADOWS.button },
}
