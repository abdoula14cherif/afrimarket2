import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import AvisModal from '../components/AvisModal.jsx'
import SignalementModal from '../components/SignalementModal.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { CardSkeletonGrid } from '../components/LoadingSkeleton.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const PAGE_SIZE = 12

const CATEGORIES = [
  { key: 'tout', label: 'Tout', color: COLORS.indigo },
  { key: 'telephones', label: 'Téléphones', color: COLORS.terracotta },
  { key: 'services', label: 'Services', color: COLORS.teal },
  { key: 'mode', label: 'Mode', color: COLORS.clay },
  { key: 'maison', label: 'Maison', color: COLORS.marigold },
  { key: 'autres', label: 'Autres', color: '#6C6396' },
]
const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function ExplorePage({ user, onNavigate }) {
  const [annonces, setAnnonces] = useState([])
  const [favoris, setFavoris] = useState(new Set())
  const [avisMap, setAvisMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('tout')
  const [ratingTarget, setRatingTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  useEffect(() => {
    loadPage(0, true)
  }, [activeCat, search])

  useEffect(() => {
    loadFavoris()
  }, [user])

  async function loadFavoris() {
    if (!user?.id) return
    const { data } = await supabase.from('favoris').select('annonce_id').eq('user_id', user.id)
    setFavoris(new Set((data || []).map((f) => f.annonce_id)))
  }

  async function loadPage(offset, reset) {
    if (reset) { setLoading(true); setError(false) } else { setLoadingMore(true) }

    let query = supabase
      .from('annonces')
      .select('id, titre, description, prix, ville, photo_url, contact, categorie')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (activeCat !== 'tout') query = query.eq('categorie', activeCat)
    if (search) query = query.or(`titre.ilike.%${search}%,ville.ilike.%${search}%`)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(true)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const list = data || []
    setAnnonces((prev) => (reset ? list : [...prev, ...list]))
    setHasMore(list.length === PAGE_SIZE)

    const ids = list.map((a) => a.id)
    if (ids.length) {
      const { data: avisData } = await supabase.from('avis').select('annonce_id, note').in('annonce_id', ids)
      setAvisMap((prev) => {
        const next = { ...prev }
        ;(avisData || []).forEach((a) => {
          if (!next[a.annonce_id]) next[a.annonce_id] = []
          next[a.annonce_id].push(a.note)
        })
        return next
      })
    }

    setLoading(false)
    setLoadingMore(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleContact = async (item) => {
    if (!item.contact) return
    supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const toggleFavori = async (annonceId) => {
    if (!user?.id) return
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

  const avgNote = (id) => {
    const notes = avisMap[id]
    if (!notes || notes.length === 0) return null
    return (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Marketplace</div>
        <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
          <span>🔍</span>
          <input type="text" placeholder="Chercher un produit, une ville..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={styles.searchInput} />
        </form>
      </div>

      <div style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} onClick={() => setActiveCat(cat.key)}
            style={{ ...styles.chip, background: cat.color, color: cat.key === 'maison' ? COLORS.ink : '#fff', outline: activeCat === cat.key ? `2px solid ${COLORS.ink}` : 'none', outlineOffset: 2 }}>
            {cat.label}
          </div>
        ))}
      </div>

      {loading && <CardSkeletonGrid count={6} />}
      {!loading && error && <ErrorState message="Impossible de charger les annonces." onRetry={() => loadPage(0, true)} />}
      {!loading && !error && annonces.length === 0 && <p style={styles.emptyText}>Aucune annonce ne correspond à ta recherche.</p>}

      {!loading && !error && annonces.length > 0 && (
        <>
          <div style={styles.grid}>
            {annonces.map((item) => {
              const note = avgNote(item.id)
              const isFav = favoris.has(item.id)
              return (
                <div key={item.id} style={styles.card} onClick={(e) => { if (e.target.closest('[data-noclick]')) return; onNavigate('annonce-detail', item.id) }}>
                  <div style={styles.cardImg}>
                    {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
                    <span data-noclick="true" style={styles.heart} onClick={() => toggleFavori(item.id)}>{isFav ? '❤️' : '🤍'}</span>
                    <span data-noclick="true" style={styles.menuDots} onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}>⋮</span>
                    {menuOpenId === item.id && (
                      <div style={styles.dropdown}>
                        <div data-noclick="true" style={styles.dropdownItem} onClick={() => { setReportTarget(item); setMenuOpenId(null) }}>🚩 Signaler</div>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    <p style={styles.cardTitle}>{item.titre}</p>
                    <p style={styles.cardLoc}>📍 {item.ville}{note && <span style={styles.noteBadge}> · ⭐ {note}</span>}</p>
                    <span style={styles.priceTag}>{item.prix?.toLocaleString('fr-FR')} F</span>
                    <button data-noclick="true" style={styles.contactBtn} onClick={() => handleContact(item)}>💬 Contacter</button>
                    {user && <span data-noclick="true" style={styles.rateLink} onClick={() => setRatingTarget(item)}>Laisser un avis</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div style={styles.loadMoreWrapper}>
              <button style={styles.loadMoreBtn} onClick={() => loadPage(annonces.length, false)} disabled={loadingMore}>
                {loadingMore ? 'Chargement...' : "Voir plus d'annonces"}
              </button>
            </div>
          )}
        </>
      )}

      {ratingTarget && <AvisModal annonce={ratingTarget} user={user} onClose={() => setRatingTarget(null)} onSubmitted={() => loadPage(0, true)} />}
      {reportTarget && <SignalementModal annonce={reportTarget} user={user} onClose={() => setReportTarget(null)} />}

      <BottomNav active="explore" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '24px 20px 20px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20, marginBottom: 14 },
  searchBar: { background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, width: '100%', color: COLORS.ink, fontFamily: FONT_BODY, background: 'transparent' },
  catRow: { display: 'flex', gap: 8, padding: '16px 20px 4px', overflowX: 'auto' },
  chip: { flex: '0 0 auto', padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 20px' },
  card: { background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(43,37,96,0.08)', cursor: 'pointer' },
  cardImg: { height: 110, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 34 },
  heart: { position: 'absolute', top: 8, right: 8, fontSize: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  menuDots: { position: 'absolute', top: 8, left: 8, fontSize: 16, fontWeight: 900, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', top: 38, left: 8, background: '#fff', borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' },
  dropdownItem: { padding: '10px 14px', fontSize: 12, fontWeight: 600, color: COLORS.terracotta, whiteSpace: 'nowrap', cursor: 'pointer' },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34 },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  noteBadge: { color: COLORS.marigold, fontWeight: 700 },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  contactBtn: { display: 'block', width: '100%', marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' },
  rateLink: { display: 'block', textAlign: 'center', marginTop: 6, fontSize: 10.5, color: COLORS.indigoSoft, fontWeight: 600, cursor: 'pointer' },
  loadMoreWrapper: { textAlign: 'center', padding: '0 20px 20px' },
  loadMoreBtn: { background: COLORS.card, color: COLORS.indigo, border: `1.5px solid ${COLORS.indigo}`, borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
