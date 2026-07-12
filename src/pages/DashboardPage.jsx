import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../components/ThemeContext.jsx'
import { FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_ICON = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }
const CATEGORY_LABEL = { telephones: 'Téléphones', services: 'Services', mode: 'Mode', maison: 'Maison', autres: 'Autres' }

export default function DashboardPage({ user, onNavigate, onLogout }) {
  const { colors, theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contactsCount, setContactsCount] = useState(0)
  const [popular, setPopular] = useState([])
  const [favoris, setFavoris] = useState(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      const { data } = await supabase.from('profiles').select('prenom, nom, entreprise').eq('id', user.id).single()
      setProfile(data)

      const { data: myAnnonces } = await supabase.from('annonces').select('id').eq('user_id', user.id)
      const myAnnonceIds = (myAnnonces || []).map((a) => a.id)
      if (myAnnonceIds.length > 0) {
        const { count } = await supabase.from('contacts_log').select('id', { count: 'exact', head: true }).in('annonce_id', myAnnonceIds)
        setContactsCount(count || 0)
      }

      const { data: recent } = await supabase
        .from('annonces')
        .select('id, titre, prix, ville, photo_url, contact, categorie')
        .order('created_at', { ascending: false })
        .limit(8)
      setPopular(recent || [])

      const { data: favData } = await supabase.from('favoris').select('annonce_id').eq('user_id', user.id)
      setFavoris(new Set((favData || []).map((f) => f.annonce_id)))

      setLoading(false)
    }
    loadData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout?.()
  }

  const toggleFavori = async (annonceId, e) => {
    e.stopPropagation()
    const isFav = favoris.has(annonceId)
    const next = new Set(favoris)
    if (isFav) {
      next.delete(annonceId)
      setFavoris(next)
      await supabase.from('favoris').delete().eq('user_id', user.id).eq('annonce_id', annonceId)
    } else {
      next.add(annonceId)
      setFavoris(next)
      await supabase.from('favoris').insert({ user_id: user.id, annonce_id: annonceId })
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onNavigate?.('explore')
  }

  const styles = getStyles(colors)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.topRow}>
          <div style={styles.brand}>Gain<span style={{ color: colors.marigold }}>Pay</span></div>
          <div style={styles.topIcons}>
            <span style={styles.themeToggle} onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span style={styles.bellWrapper} onClick={() => onNavigate?.('contacts')}>
              🔔
              {contactsCount > 0 && <span style={styles.badge}>{contactsCount > 9 ? '9+' : contactsCount}</span>}
            </span>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
          <span>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            style={styles.searchInput}
          />
        </form>
      </div>

      <div style={styles.body}>
        <div style={styles.promoBanner} onClick={() => onNavigate?.('ventes')}>
          <div style={styles.promoGlow} />
          <div style={styles.promoText}>
            <p style={styles.promoTitle}>Tout ce dont vous avez besoin,<br /><span style={{ color: colors.marigold }}>au même endroit.</span></p>
            <span style={styles.promoBtn}>Découvrir →</span>
          </div>
          <span style={styles.promoIcon}>🛍️</span>
        </div>

        <div style={styles.sectionHeadRow}>
          <p style={styles.sectionTitle}>Catégories</p>
          <span style={styles.seeAll} onClick={() => onNavigate?.('explore')}>Voir tout</span>
        </div>
        <div style={styles.catRow}>
          {Object.keys(CATEGORY_ICON).map((key) => (
            <div key={key} style={styles.catItem} onClick={() => onNavigate?.('explore')}>
              <div style={styles.catIconWrap}>
                <span style={styles.catIcon}>{CATEGORY_ICON[key]}</span>
              </div>
              <span style={styles.catLabel}>{CATEGORY_LABEL[key]}</span>
            </div>
          ))}
        </div>

        <div style={styles.sectionHeadRow}>
          <p style={styles.sectionTitle}>Produits populaires</p>
          <span style={styles.seeAll} onClick={() => onNavigate?.('explore')}>Voir tout</span>
        </div>

        {loading && <p style={styles.emptyText}>Chargement...</p>}
        {!loading && popular.length === 0 && <p style={styles.emptyText}>Aucune annonce pour l'instant.</p>}

        <div style={styles.grid}>
          {popular.map((item, i) => (
            <div key={item.id} style={{ ...styles.card, animation: `gp-fade-up 0.4s ease ${i * 50}ms both` }} onClick={() => onNavigate?.('annonce-detail', item.id)}>
              <div style={styles.cardImg}>
                {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_ICON[item.categorie] || '🛍️'}</span>}
                <span style={styles.heart} onClick={(e) => toggleFavori(item.id, e)}>{favoris.has(item.id) ? '❤️' : '🤍'}</span>
              </div>
              <div style={styles.cardBody}>
                <p style={styles.cardPrice}>{item.prix?.toLocaleString('fr-FR')} <span style={styles.cardCurrency}>FCFA</span></p>
                <p style={styles.cardTitle}>{item.titre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Accueil" active onClick={() => onNavigate?.('dashboard')} colors={colors} />
        <NavItem icon="➕" label="Publier" onClick={() => onNavigate?.('publish')} colors={colors} />
        <NavItem icon="💬" label="Messages" onClick={() => onNavigate?.('contacts')} colors={colors} />
        <NavItem icon="👤" label="Profil" onClick={() => onNavigate?.('profile')} colors={colors} />
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, colors }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
      <span style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? colors.marigold : colors.muted }}>{label}</span>
    </div>
  )
}

function getStyles(colors) {
  return {
    page: { minHeight: '100vh', background: colors.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
    header: { padding: '24px 20px 18px' },
    topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22, color: colors.ink },
    topIcons: { display: 'flex', alignItems: 'center', gap: 14 },
    themeToggle: { fontSize: 16, cursor: 'pointer' },
    bellWrapper: { position: 'relative', fontSize: 18, cursor: 'pointer' },
    badge: { position: 'absolute', top: -6, right: -8, background: colors.marigold, color: colors.indigoDeep, fontSize: 9, fontWeight: 900, borderRadius: 8, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' },
    searchBar: { display: 'flex', alignItems: 'center', gap: 10, background: colors.card, borderRadius: 14, padding: '13px 16px', border: `1px solid ${colors.border}` },
    searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: colors.ink, fontSize: 14, fontFamily: FONT_BODY },
    body: { padding: '4px 20px 0' },
    promoBanner: { position: 'relative', background: colors.card, borderRadius: 18, padding: '20px', marginBottom: 26, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    promoGlow: { position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(242,169,59,0.18), transparent 70%)' },
    promoText: { position: 'relative', zIndex: 1 },
    promoTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: colors.ink, lineHeight: 1.4, margin: '0 0 12px' },
    promoBtn: { display: 'inline-block', background: colors.marigold, color: colors.indigoDeep, fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10 },
    promoIcon: { fontSize: 40, opacity: 0.7, position: 'relative', zIndex: 1 },
    sectionHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
    sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: colors.ink, margin: 0 },
    seeAll: { fontSize: 11.5, fontWeight: 600, color: colors.muted, cursor: 'pointer' },
    catRow: { display: 'flex', gap: 18, overflowX: 'auto', marginBottom: 28, paddingBottom: 4 },
    catItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', flex: '0 0 auto', width: 64 },
    catIconWrap: { width: 56, height: 56, borderRadius: '50%', background: colors.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}` },
    catIcon: { fontSize: 24 },
    catLabel: { fontSize: 10.5, fontWeight: 600, color: colors.muted, textAlign: 'center' },
    emptyText: { fontSize: 13, color: colors.muted, textAlign: 'center', padding: '20px 0' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingBottom: 10 },
    card: { background: colors.card, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${colors.border}` },
    cardImg: { height: 110, background: colors.sand, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
    cardImgFallback: { fontSize: 30 },
    heart: { position: 'absolute', top: 8, right: 8, fontSize: 14, background: 'rgba(0,0,0,0.35)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    cardBody: { padding: '10px 12px 12px' },
    cardPrice: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: colors.marigold, margin: '0 0 3px' },
    cardCurrency: { fontSize: 10, fontWeight: 600, color: colors.muted },
    cardTitle: { fontSize: 11.5, color: colors.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.card, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-around', padding: '14px 0 18px' },
  }
}
