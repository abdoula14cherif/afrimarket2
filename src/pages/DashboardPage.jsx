import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function DashboardPage({ user, onNavigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [annoncesCount, setAnnoncesCount] = useState(0)
  const [contactsCount, setContactsCount] = useState(0)
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      const { data } = await supabase.from('profiles').select('prenom, nom, entreprise').eq('id', user.id).single()
      setProfile(data)

      const { count } = await supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      setAnnoncesCount(count || 0)

      const { count: contactCount } = await supabase
        .from('contacts_log')
        .select('id, annonces!inner(user_id)', { count: 'exact', head: true })
        .eq('annonces.user_id', user.id)
      setContactsCount(contactCount || 0)

      const { data: recent } = await supabase
        .from('annonces')
        .select('id, titre, prix, ville, photo_url, contact, categorie')
        .order('created_at', { ascending: false })
        .limit(4)
      setFeatured(recent || [])

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
    supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
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
        <StatCard label="Annonces publiées" value={String(annoncesCount)} color={COLORS.indigo} onClick={() => onNavigate?.('my-listings')} />
        <StatCard label="Contacts reçus" value={String(contactsCount)} color={COLORS.terracotta} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Commence ici</h2>
        <ActionCard icon="📢" title="Publier une annonce" subtitle="Produit ou service, en 2 minutes" onClick={() => onNavigate?.('publish')} />
        <ActionCard icon="📦" title="Mes annonces" subtitle="Voir, modifier ou supprimer" onClick={() => onNavigate?.('my-listings')} />
        <ActionCard icon="❤️" title="Mes favoris" subtitle="Les annonces que tu as sauvegardées" onClick={() => onNavigate?.('favoris')} />
        <ActionCard icon="🎁" title="Parrainage & Points" subtitle="Invite tes amis, gagne de l'argent" onClick={() => onNavigate?.('parrainage')} />
        <ActionCard icon="🔍" title="Explorer la marketplace" subtitle="Vois ce que les autres proposent" onClick={() => onNavigate?.('explore')} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeadRow}>
          <h2 style={styles.sectionTitle}>Annonces en vedette</h2>
          <span style={styles.seeAll} onClick={() => onNavigate?.('explore')}>Tout voir</span>
        </div>
        {!loading && featured.length === 0 && <p style={styles.emptyText}>Aucune annonce pour l'instant — sois le premier à publier !</p>}
        <div style={styles.grid}>
          {featured.map((item) => (
            <div key={item.id} style={styles.card} onClick={() => onNavigate?.('annonce-detail', item.id)}>
              <div style={styles.cardImg}>
                {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
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

function StatCard({ label, value, color, onClick }) {
  return (
    <div style={{ ...styles.statCard, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
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
  section: { padding: '22px 20px 4px' },
  sectionHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, margin: '0 0 12px' },
  seeAll: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft, cursor: 'pointer' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' },
  actionCard: { display: 'flex', alignItems: 'center', gap: 14, background: COLORS.card, borderRadius: 14, padding: '14px 16px', marginBottom: 12, boxShadow: '0 4px 14px rgba(43,37,96,0.06)', cursor: 'pointer' },
  actionIcon: { fontSize: 26 },
  actionTitle: { fontSize: 14, fontWeight: 700, color: COLORS.ink },
  actionSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingBottom: 10 },
  card: { background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(43,37,96,0.08)', cursor: 'pointer' },
  cardImg: { height: 100, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 32 },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34 },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  contactBtn: { display: 'block', width: '100%', marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' },
}
