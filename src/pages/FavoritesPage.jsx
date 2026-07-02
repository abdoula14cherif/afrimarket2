import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function FavoritesPage({ user, onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      const { data } = await supabase
        .from('favoris')
        .select('annonce_id, annonces(id, titre, prix, ville, photo_url, contact, categorie)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setItems((data || []).filter((f) => f.annonces).map((f) => f.annonces))
      setLoading(false)
    }
    load()
  }, [user])

  const handleContact = async (item) => {
    if (!item.contact) return
    supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const handleRemove = async (annonceId) => {
    setItems((prev) => prev.filter((i) => i.id !== annonceId))
    await supabase.from('favoris').delete().eq('user_id', user.id).eq('annonce_id', annonceId)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Mes favoris</div>
        <p style={styles.subtitle}>{items.length} annonce{items.length > 1 ? 's' : ''} sauvegardée{items.length > 1 ? 's' : ''}</p>
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}
      {!loading && items.length === 0 && <p style={styles.emptyText}>Aucun favori pour l'instant — explore la marketplace et appuie sur 🤍</p>}

      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardImg}>
              {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
              <span style={styles.heart} onClick={() => handleRemove(item.id)}>❤️</span>
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

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 20px' },
  card: { background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(43,37,96,0.08)' },
  cardImg: { height: 110, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 34 },
  heart: { position: 'absolute', top: 8, right: 8, fontSize: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34 },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  contactBtn: { display: 'block', width: '100%', marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' },
}
