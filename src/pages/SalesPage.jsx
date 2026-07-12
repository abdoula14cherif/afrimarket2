import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../components/ThemeContext.jsx'
import { FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_ICON = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function SalesPage({ user, onNavigate }) {
  const { colors } = useTheme()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalVentes, setTotalVentes] = useState(0)
  const [ventesRecentes, setVentesRecentes] = useState([])

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      const { data: prof } = await supabase.from('profiles').select('prenom').eq('id', user.id).single()
      setProfile(prof)

      const { data: myAnnonces } = await supabase.from('annonces').select('id').eq('user_id', user.id)
      const myIds = (myAnnonces || []).map((a) => a.id)

      if (myIds.length > 0) {
        const { data: ventes } = await supabase
          .from('offres')
          .select('id, montant_propose, created_at, annonce_id, annonces(titre, photo_url, categorie)')
          .in('annonce_id', myIds)
          .eq('statut', 'acceptee')
          .order('created_at', { ascending: false })

        const total = (ventes || []).reduce((sum, v) => sum + Number(v.montant_propose), 0)
        setTotalVentes(total)
        setVentesRecentes((ventes || []).slice(0, 3))
      }

      setLoading(false)
    }
    loadData()
  }, [user])

  const styles = getStyles(colors)

  const shortcuts = [
    { icon: '📢', label: 'Publier', dest: 'publish' },
    { icon: '📦', label: 'Mes annonces', dest: 'my-listings' },
    { icon: '❤️', label: 'Favoris', dest: 'favoris' },
    { icon: '🎁', label: 'Parrainage', dest: 'parrainage' },
    { icon: '🎟️', label: 'Codes promo', dest: 'promo-codes' },
    { icon: '🔍', label: 'Explorer', dest: 'explore' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Gain<span style={{ color: colors.marigold }}>Pay</span></div>
        <p style={styles.greeting}>{loading ? 'Chargement...' : `Bonjour ${profile?.prenom || ''} 👋`}</p>
      </div>

      <div style={styles.statCard}>
        <p style={styles.statTitle}>Mes ventes</p>
        <p style={styles.statAmount}>{totalVentes.toLocaleString('fr-FR')} FCFA</p>
        <p style={styles.statSub}>Total des ventes</p>

        <div style={styles.iconRow}>
          <IconBtn icon="📦" label="Produits" onClick={() => onNavigate?.('my-listings')} />
          <IconBtn icon="📋" label="Commandes" onClick={() => onNavigate?.('offres')} />
          <IconBtn icon="💬" label="Messages" onClick={() => onNavigate?.('contacts')} />
        </div>
      </div>

      <div style={styles.body}>
        <p style={styles.sectionTitle}>Ventes récentes</p>
        {loading && <p style={styles.emptyText}>Chargement...</p>}
        {!loading && ventesRecentes.length === 0 && (
          <p style={styles.emptyText}>Aucune vente confirmée pour l'instant — accepte une offre pour la voir apparaître ici.</p>
        )}
        {ventesRecentes.map((v) => (
          <div key={v.id} style={styles.venteRow}>
            <div style={styles.venteThumb}>
              {v.annonces?.photo_url ? <img src={v.annonces.photo_url} alt="" style={styles.venteThumbImg} /> : <span>{CATEGORY_ICON[v.annonces?.categorie] || '🛍️'}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.venteTitle}>{v.annonces?.titre}</p>
              <p style={styles.venteDate}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <p style={styles.venteAmount}>{Number(v.montant_propose).toLocaleString('fr-FR')} FCFA</p>
          </div>
        ))}

        <button style={styles.seeAllBtn} onClick={() => onNavigate?.('offres')}>Voir toutes les ventes</button>

        <p style={{ ...styles.sectionTitle, marginTop: 28 }}>Raccourcis</p>
        <div style={styles.shortcutsGrid}>
          {shortcuts.map((s) => (
            <div key={s.dest} style={styles.shortcutItem} onClick={() => onNavigate?.(s.dest)}>
              <span style={styles.shortcutIcon}>{s.icon}</span>
              <span style={styles.shortcutLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IconBtn({ icon, label, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#211E1B' }}>{label}</span>
    </div>
  )
}

function getStyles(colors) {
  return {
    page: { minHeight: '100vh', background: colors.sand, fontFamily: FONT_BODY, paddingBottom: 40 },
    header: { background: colors.indigoDeep, padding: '24px 20px 60px' },
    brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22, color: '#fff' },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
    statCard: { background: '#fff', borderRadius: 20, padding: '22px 20px', margin: '-42px 20px 0', boxShadow: '0 12px 30px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1 },
    statTitle: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: '#211E1B', margin: '0 0 6px' },
    statAmount: { fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: '#211E1B', margin: '0 0 2px' },
    statSub: { fontSize: 11.5, color: '#8b8578', margin: '0 0 18px' },
    iconRow: { display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #EAE5D8', paddingTop: 16 },
    body: { padding: '30px 20px 0' },
    sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: colors.ink, margin: '0 0 12px' },
    emptyText: { fontSize: 12.5, color: colors.muted, marginBottom: 16 },
    venteRow: { display: 'flex', alignItems: 'center', gap: 12, background: colors.card, borderRadius: 14, padding: '10px 12px', marginBottom: 10, border: `1px solid ${colors.border}` },
    venteThumb: { width: 44, height: 44, borderRadius: 10, background: colors.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    venteThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    venteTitle: { fontSize: 13, fontWeight: 700, color: colors.ink, margin: 0 },
    venteDate: { fontSize: 10.5, color: colors.muted, margin: '2px 0 0' },
    venteAmount: { fontSize: 12.5, fontWeight: 700, color: '#2F8F82', margin: 0 },
    seeAllBtn: { width: '100%', background: colors.indigoDeep, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
    shortcutsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingBottom: 20 },
    shortcutItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: colors.card, borderRadius: 14, padding: '14px 6px', cursor: 'pointer', border: `1px solid ${colors.border}` },
    shortcutIcon: { fontSize: 22 },
    shortcutLabel: { fontSize: 10, fontWeight: 600, color: colors.ink, textAlign: 'center' },
  }
}
