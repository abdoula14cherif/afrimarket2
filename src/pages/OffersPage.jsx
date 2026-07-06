import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function OffersPage({ user, onNavigate }) {
  const [tab, setTab] = useState('recues')
  const [recues, setRecues] = useState([])
  const [envoyees, setEnvoyees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [user])

  async function loadAll() {
    if (!user?.id) return
    setLoading(true)

    const { data: myAnnonces } = await supabase.from('annonces').select('id').eq('user_id', user.id)
    const myIds = (myAnnonces || []).map((a) => a.id)

    if (myIds.length > 0) {
      const { data: recuesData } = await supabase
        .from('offres')
        .select('id, montant_propose, message, statut, created_at, annonce_id, annonces(titre, prix, contact), profiles(prenom, nom)')
        .in('annonce_id', myIds)
        .order('created_at', { ascending: false })
      setRecues(recuesData || [])
    }

    const { data: envoyeesData } = await supabase
      .from('offres')
      .select('id, montant_propose, message, statut, created_at, annonces(titre, prix)')
      .eq('acheteur_id', user.id)
      .order('created_at', { ascending: false })
    setEnvoyees(envoyeesData || [])

    setLoading(false)
  }

  const handleRespond = async (offre, statut) => {
    setRecues((prev) => prev.map((o) => (o.id === offre.id ? { ...o, statut } : o)))
    await supabase.from('offres').update({ statut }).eq('id', offre.id)
  }

  const handleContactAcheteur = (offre) => {
    if (!offre.annonces?.contact) return
    const digits = offre.annonces.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('dashboard')}>← Retour</span>
        <div style={styles.brand}>Offres</div>
      </div>

      <div style={styles.tabs}>
        <div onClick={() => setTab('recues')} style={{ ...styles.tab, background: tab === 'recues' ? COLORS.indigo : '#fff', color: tab === 'recues' ? '#fff' : COLORS.ink }}>
          Reçues ({recues.filter((o) => o.statut === 'en_attente').length})
        </div>
        <div onClick={() => setTab('envoyees')} style={{ ...styles.tab, background: tab === 'envoyees' ? COLORS.indigo : '#fff', color: tab === 'envoyees' ? '#fff' : COLORS.ink }}>
          Envoyées
        </div>
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}

      {!loading && tab === 'recues' && (
        <div style={styles.list}>
          {recues.length === 0 && <p style={styles.emptyText}>Aucune offre reçue pour l'instant.</p>}
          {recues.map((o) => (
            <div key={o.id} style={styles.card}>
              <p style={styles.cardTitle}>{o.annonces?.titre}</p>
              <p style={styles.cardSub}>
                Prix affiché {o.annonces?.prix?.toLocaleString('fr-FR')} F → proposé <strong>{o.montant_propose.toLocaleString('fr-FR')} F</strong>
              </p>
              {o.message && <p style={styles.offreMessage}>"{o.message}"</p>}
              <p style={styles.cardSub}>De {o.profiles?.prenom} {o.profiles?.nom}</p>

              {o.statut === 'en_attente' && (
                <div style={styles.actions}>
                  <button style={styles.refuseBtn} onClick={() => handleRespond(o, 'refusee')}>Refuser</button>
                  <button style={styles.acceptBtn} onClick={() => { handleRespond(o, 'acceptee'); handleContactAcheteur(o) }}>Accepter & contacter</button>
                </div>
              )}
              {o.statut !== 'en_attente' && (
                <span style={{ ...styles.statutTag, color: o.statut === 'acceptee' ? COLORS.teal : COLORS.terracotta }}>
                  {o.statut === 'acceptee' ? '✅ Acceptée' : '❌ Refusée'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'envoyees' && (
        <div style={styles.list}>
          {envoyees.length === 0 && <p style={styles.emptyText}>Tu n'as fait aucune offre pour l'instant.</p>}
          {envoyees.map((o) => (
            <div key={o.id} style={styles.card}>
              <p style={styles.cardTitle}>{o.annonces?.titre}</p>
              <p style={styles.cardSub}>Ton offre : {o.montant_propose.toLocaleString('fr-FR')} F (affiché {o.annonces?.prix?.toLocaleString('fr-FR')} F)</p>
              <span style={{ ...styles.statutTag, color: o.statut === 'acceptee' ? COLORS.teal : o.statut === 'refusee' ? COLORS.terracotta : COLORS.marigold }}>
                {o.statut === 'acceptee' ? '✅ Acceptée' : o.statut === 'refusee' ? '❌ Refusée' : '⏳ En attente'}
              </span>
            </div>
          ))}
        </div>
      )}

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '20px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  backBtn: { fontSize: 12, fontWeight: 700, color: '#E4E1F2', cursor: 'pointer', display: 'block', marginBottom: 10 },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19 },
  tabs: { display: 'flex', gap: 8, padding: '16px 20px 0' },
  tab: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,37,96,0.08)' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  list: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: COLORS.card, borderRadius: 14, padding: '14px 16px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  cardTitle: { fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' },
  cardSub: { fontSize: 12, color: COLORS.muted, margin: '0 0 6px' },
  offreMessage: { fontSize: 12, color: COLORS.ink, fontStyle: 'italic', margin: '0 0 6px' },
  actions: { display: 'flex', gap: 8, marginTop: 10 },
  refuseBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  acceptBtn: { flex: 1, background: COLORS.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  statutTag: { fontSize: 12, fontWeight: 700, display: 'block', marginTop: 6 },
}
