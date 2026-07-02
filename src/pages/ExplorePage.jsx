import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORIES = [
  { key: 'tout', label: 'Tout', color: COLORS.indigo },
  { key: 'telephones', label: 'Téléphones', color: COLORS.terracotta },
  { key: 'services', label: 'Services', color: COLORS.teal },
  { key: 'mode', label: 'Mode', color: COLORS.clay },
  { key: 'maison', label: 'Maison', color: COLORS.marigold },
  { key: 'autres', label: 'Autres', color: '#6C6396' },
]

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function ExplorePage({ onNavigate }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('tout')

  useEffect(() => {
    async function loadAnnonces() {
      const { data } = await supabase
        .from('annonces')
        .select('id, titre, description, prix, ville, photo_url, contact, categorie')
        .order('created_at', { ascending: false })
      setAnnonces(data || [])
      setLoading(false)
    }
    loadAnnonces()
  }, [])

  const handleContact = async (item) => {
    if (!item.contact) return
    supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const filtered = annonces.filter((a) => {
    const matchCat = activeCat === 'tout' || a.categorie === activeCat
    const q = search.toLowerCase()
    const matchSearch = !q || a.titre?.toLowerCase().includes(q) || a.ville?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Marketplace</div>
        <div style={styles.searchBar}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Chercher un produit, une ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            style={{
              ...styles.chip,
              background: cat.color,
              color: cat.key === 'maison' ? COLORS.ink : '#fff',
              outline: activeCat === cat.key ? `2px solid ${COLORS.ink}` : 'none',
              outlineOffset: 2,
            }}
          >
            {cat.label}
          </div>
        ))}
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}
      {!loading && filtered.length === 0 && (
        <p style={styles.emptyText}>Aucune annonce ne correspond à ta recherche.</p>
      )}

      <div style={styles.grid}>
        {filtered.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardImg}>
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} />
              ) : (
                <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>
              )}
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardTitle}>{item.titre}</p>
              <p style={styles.cardLoc}>📍 {item.ville}</p>
              <span style={styles.priceTag}>{item.prix?.toLocaleString('fr-FR')} F</span>
              <button style={styles.contactBtn} onClick={() => handleContact(item)}>💬 Contacter</button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="explore" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '24px 20px 20px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20, marginBottom: 14 },
  searchBar: { background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, width: '100%', color: COLORS.ink, fontFamily: FONT_BODY },
  catRow: { display: 'flex', gap: 8, padding: '16px 20px 4px', overflowX: 'auto' },
  chip: { flex: '0 0 auto', padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 20px' },
  card: { background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(43,37,96,0.08)' },
  cardImg: { height: 110, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 34 },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34 },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  contactBtn: { display: 'block', width: '100%', marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' },
}
