import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const ADMIN_EMAIL = 'abdoula14cherif@gmail.com'

export default function AdminPage({ user, onNavigate }) {
  const [tab, setTab] = useState('verifications')
  const [verifications, setVerifications] = useState([])
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)
  const [docUrls, setDocUrls] = useState({})

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (isAdmin) loadAll()
  }, [user])

  async function loadAll() {
    setLoading(true)
    const { data: verifs } = await supabase
      .from('verification_requests')
      .select('id, document_url, status, created_at, user_id, profiles(prenom, nom, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setVerifications(verifs || [])

    const { data: reports } = await supabase
      .from('signalements')
      .select('id, raison, statut, created_at, annonce_id, annonces(id, titre, user_id), profiles(prenom)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: true })
    setSignalements(reports || [])

    setLoading(false)
  }

  const loadDocUrl = async (path, requestId) => {
    if (docUrls[requestId]) return
    const { data } = await supabase.storage.from('verification-docs').createSignedUrl(path, 120)
    if (data?.signedUrl) {
      setDocUrls((prev) => ({ ...prev, [requestId]: data.signedUrl }))
    }
  }

  const handleApprove = async (req) => {
    await supabase.from('profiles').update({ verified: true }).eq('id', req.user_id)
    await supabase.from('verification_requests').update({ status: 'approved' }).eq('id', req.id)
    setVerifications((prev) => prev.filter((v) => v.id !== req.id))
  }

  const handleReject = async (req) => {
    await supabase.from('verification_requests').update({ status: 'rejected' }).eq('id', req.id)
    setVerifications((prev) => prev.filter((v) => v.id !== req.id))
  }

  const handleDismissReport = async (report) => {
    await supabase.from('signalements').update({ statut: 'traite' }).eq('id', report.id)
    setSignalements((prev) => prev.filter((s) => s.id !== report.id))
  }

  const handleDeleteAnnonce = async (report) => {
    if (!window.confirm("Supprimer definitivement cette annonce ?")) return
    await supabase.from('annonces').delete().eq('id', report.annonce_id)
    await supabase.from('signalements').update({ statut: 'traite' }).eq('id', report.id)
    setSignalements((prev) => prev.filter((s) => s.id !== report.id))
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, fontFamily: FONT_BODY, textAlign: 'center' }}>
        <p>🔒 Accès réservé.</p>
        <span style={{ color: COLORS.indigo, fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate?.('dashboard')}>
          Retour à l'accueil
        </span>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Espace admin</div>
        <span style={styles.backBtn} onClick={() => onNavigate?.('dashboard')}>← Retour à l'app</span>
      </div>

      <div style={styles.tabs}>
        <div onClick={() => setTab('verifications')} style={{ ...styles.tab, background: tab === 'verifications' ? COLORS.indigo : '#fff', color: tab === 'verifications' ? '#fff' : COLORS.ink }}>
          Vérifications ({verifications.length})
        </div>
        <div onClick={() => setTab('signalements')} style={{ ...styles.tab, background: tab === 'signalements' ? COLORS.indigo : '#fff', color: tab === 'signalements' ? '#fff' : COLORS.ink }}>
          Signalements ({signalements.length})
        </div>
      </div>

      {loading && <p style={styles.emptyText}>Chargement...</p>}

      {!loading && tab === 'verifications' && (
        <div style={styles.list}>
          {verifications.length === 0 && <p style={styles.emptyText}>Aucune demande en attente.</p>}
          {verifications.map((req) => (
            <div key={req.id} style={styles.card}>
              <p style={styles.cardTitle}>{req.profiles?.prenom} {req.profiles?.nom}</p>
              <p style={styles.cardSub}>{req.profiles?.email}</p>
              {!docUrls[req.id] ? (
                <span style={styles.viewDocBtn} onClick={() => loadDocUrl(req.document_url, req.id)}>📄 Voir la pièce d'identité</span>
              ) : (
                <img src={docUrls[req.id]} alt="Pièce d'identité" style={styles.docImg} />
              )}
              <div style={styles.actions}>
                <button style={styles.rejectBtn} onClick={() => handleReject(req)}>Refuser</button>
                <button style={styles.approveBtn} onClick={() => handleApprove(req)}>Approuver</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'signalements' && (
        <div style={styles.list}>
          {signalements.length === 0 && <p style={styles.emptyText}>Aucun signalement en attente.</p>}
          {signalements.map((report) => (
            <div key={report.id} style={styles.card}>
              <p style={styles.cardTitle}>{report.annonces?.titre || 'Annonce supprimée'}</p>
              <p style={styles.cardSub}>Signalé par {report.profiles?.prenom || 'utilisateur'} · {report.raison}</p>
              <div style={styles.actions}>
                <button style={styles.rejectBtn} onClick={() => handleDismissReport(report)}>Ignorer</button>
                <button style={styles.deleteBtn} onClick={() => handleDeleteAnnonce(report)}>Supprimer l'annonce</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 40 },
  header: { background: COLORS.indigo, padding: '20px 20px 22px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20, marginBottom: 6 },
  backBtn: { fontSize: 12, color: '#E4E1F2', cursor: 'pointer', fontWeight: 600 },
  tabs: { display: 'flex', gap: 8, padding: '16px 20px 0' },
  tab: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,37,96,0.08)' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  list: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: COLORS.card, borderRadius: 14, padding: '14px 16px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  cardTitle: { fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '0 0 3px' },
  cardSub: { fontSize: 12, color: COLORS.muted, margin: '0 0 10px' },
  viewDocBtn: { display: 'inline-block', fontSize: 12, fontWeight: 700, color: COLORS.indigo, cursor: 'pointer', marginBottom: 10 },
  docImg: { width: '100%', borderRadius: 10, marginBottom: 10 },
  actions: { display: 'flex', gap: 8 },
  rejectBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  approveBtn: { flex: 1, background: COLORS.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  deleteBtn: { flex: 1, background: COLORS.terracotta, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
}
