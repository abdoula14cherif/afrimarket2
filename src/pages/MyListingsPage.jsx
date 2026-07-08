import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }
const BOOST_PRICE = 500

export default function MyListingsPage({ user, onNavigate, onEdit }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [boostingId, setBoostingId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnnonces()
  }, [user])

  async function loadAnnonces() {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('annonces')
      .select('id, titre, prix, ville, photo_url, categorie, boosted_until')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setAnnonces(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce définitivement ?')) return
    setDeletingId(id)
    const { error: delError } = await supabase.from('annonces').delete().eq('id', id)
    setDeletingId(null)
    if (!delError) {
      setAnnonces((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const handleBoost = async (annonce) => {
    setError(null)
    setBoostingId(annonce.id)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'boost',
          id: annonce.id,
          amount: BOOST_PRICE,
          description: `GainPay - Boost annonce "${annonce.titre}" (48h)`,
        }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        setError(data.error || 'Erreur lors de la création du paiement.')
      }
    } catch (err) {
      setError('Erreur réseau, réessaie.')
    }
    setBoostingId(null)
  }

  const isBoosted = (annonce) => annonce.boosted_until && new Date(annonce.boosted_until) > new Date()

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Mes annonces</div>
        <p style={styles.subtitle}>{annonces.length} annonce{annonces.length > 1 ? 's' : ''} publiée{annonces.length > 1 ? 's' : ''}</p>
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}
      {!loading && annonces.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Tu n'as encore rien publié.</p>
          <button style={styles.publishBtn} onClick={() => onNavigate?.('publish')}>Publier ma première annonce</button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.list}>
        {annonces.map((item) => (
          <div key={item.id} style={styles.item}>
            <div style={styles.itemTop}>
              <div style={styles.thumb}>
                {item.photo_url ? <img src={item.photo_url} alt="" style={styles.thumbImg} /> : <span>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={styles.itemTitle}>{item.titre}</p>
                <p style={styles.itemMeta}>{item.ville} · {item.prix?.toLocaleString('fr-FR')} F</p>
                {isBoosted(item) && <span style={styles.boostedTag}>🚀 Boostée</span>}
              </div>
              <div style={styles.actions}>
                <span style={styles.editBtn} onClick={() => onEdit?.(item.id)}>✏️</span>
                <span style={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                  {deletingId === item.id ? '...' : '🗑️'}
                </span>
              </div>
            </div>
            {!isBoosted(item) && (
              <button style={styles.boostBtn} onClick={() => handleBoost(item)} disabled={boostingId === item.id}>
                {boostingId === item.id ? 'Redirection...' : `🚀 Booster 48h — ${BOOST_PRICE} F CFA`}
              </button>
            )}
          </div>
        ))}
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  emptyState: { textAlign: 'center', padding: '30px 20px' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '10px 0' },
  publishBtn: { marginTop: 10, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  error: { color: COLORS.terracotta, fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: '10px 20px 0' },
  list: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  item: { background: COLORS.card, borderRadius: 14, padding: '10px 12px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  itemTop: { display: 'flex', alignItems: 'center', gap: 12 },
  thumb: { width: 46, height: 46, borderRadius: 10, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemTitle: { fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.ink },
  itemMeta: { fontSize: 11, color: COLORS.muted, margin: '2px 0 0' },
  boostedTag: { fontSize: 10, fontWeight: 700, color: COLORS.marigold, marginTop: 2, display: 'inline-block' },
  actions: { display: 'flex', gap: 10, fontSize: 16, cursor: 'pointer' },
  editBtn: { cursor: 'pointer' },
  deleteBtn: { cursor: 'pointer' },
  boostBtn: { width: '100%', marginTop: 10, background: COLORS.indigo, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
}
