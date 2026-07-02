import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function ContactsPage({ user, onNavigate }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      if (!user?.id) return
      const { data } = await supabase
        .from('contacts_log')
        .select('id, created_at, annonces(id, titre, prix, ville, photo_url)')
        .order('created_at', { ascending: false })
      setLogs((data || []).filter((l) => l.annonces))
      setLoading(false)
    }
    loadLogs()
  }, [user])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Contacts reçus</div>
        <p style={styles.subtitle}>Qui s'est intéressé à tes annonces</p>
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}
      {!loading && logs.length === 0 && (
        <p style={styles.emptyText}>Personne n'a encore contacté tes annonces — partage-les !</p>
      )}

      <div style={styles.list}>
        {logs.map((log) => (
          <div key={log.id} style={styles.item}>
            <div style={styles.thumb}>
              {log.annonces.photo_url ? (
                <img src={log.annonces.photo_url} alt="" style={styles.thumbImg} />
              ) : (
                <span>🛍️</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.itemTitle}>{log.annonces.titre}</p>
              <p style={styles.itemMeta}>
                {log.annonces.ville} • {new Date(log.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span style={styles.priceTag}>{log.annonces.prix?.toLocaleString('fr-FR')} F</span>
          </div>
        ))}
      </div>

      <BottomNav active="contacts" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  list: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  item: { display: 'flex', alignItems: 'center', gap: 12, background: COLORS.card, borderRadius: 14, padding: '10px 12px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  thumb: { width: 46, height: 46, borderRadius: 10, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemTitle: { fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.ink },
  itemMeta: { fontSize: 11, color: COLORS.muted, margin: '2px 0 0' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5, color: COLORS.indigo },
}
