import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const MIN_POINTS_RETRAIT = 500
const TAUX_FCFA_PAR_POINT = 2

export default function ParrainagePage({ user, onNavigate }) {
  const [points, setPoints] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [historique, setHistorique] = useState([])

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    if (!user?.id) return
    const { data } = await supabase.from('profiles').select('points, referral_code, numero').eq('id', user.id).single()
    if (data) {
      setPoints(data.points || 0)
      setReferralCode(data.referral_code || '')
      setNumero(data.numero || '')
    }
    const { data: retraits } = await supabase
      .from('retraits')
      .select('points_utilises, montant_fcfa, statut, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setHistorique(retraits || [])
    setLoading(false)
  }

  const shareLink = `${window.location.origin}?ref=${referralCode}`

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: 'Rejoins-moi sur GainPay', url: shareLink })
    } else {
      navigator.clipboard.writeText(shareLink)
      setMessage('Lien copié !')
      setTimeout(() => setMessage(null), 2000)
    }
  }

  const handleWithdraw = async () => {
    setError(null)
    setMessage(null)
    if (points < MIN_POINTS_RETRAIT) {
      setError(`Il te faut au moins ${MIN_POINTS_RETRAIT} points (${MIN_POINTS_RETRAIT * TAUX_FCFA_PAR_POINT} F CFA) pour retirer.`)
      return
    }
    if (!numero) {
      setError('Ajoute un numéro de réception dans ton profil avant de retirer.')
      return
    }
    setRequesting(true)
    const { error: rpcError } = await supabase.rpc('request_retrait', { p_user_id: user.id, p_points: points, p_numero: numero })
    setRequesting(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setMessage('Demande de retrait envoyée ✅')
    loadData()
  }

  if (loading) return <div style={{ padding: 24, fontFamily: FONT_BODY }}>Chargement...</div>

  const montantDisponible = points * TAUX_FCFA_PAR_POINT

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('dashboard')}>← Retour</span>
        <div style={styles.brand}>Parrainage & Points</div>
      </div>

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Ton solde</p>
        <p style={styles.balanceValue}>{points} points</p>
        <p style={styles.balanceFcfa}>≈ {montantDisponible.toLocaleString('fr-FR')} F CFA</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Invite tes amis</p>
        <p style={styles.p}>Gagne <strong>10 points</strong> pour chaque ami qui s'inscrit avec ton lien. 100 points = 200 F CFA.</p>
        <div style={styles.linkBox}>
          <span style={styles.linkText}>{shareLink}</span>
        </div>
        <button style={styles.shareBtn} onClick={handleShare}>📤 Partager mon lien</button>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Retirer mes gains</p>
        <p style={styles.p}>Minimum {MIN_POINTS_RETRAIT} points ({MIN_POINTS_RETRAIT * TAUX_FCFA_PAR_POINT} F CFA) pour demander un retrait vers ton numéro {numero || '(non renseigné)'}.</p>
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}
        <button style={styles.withdrawBtn} onClick={handleWithdraw} disabled={requesting || points < MIN_POINTS_RETRAIT}>
          {requesting ? 'Envoi...' : `Retirer ${montantDisponible.toLocaleString('fr-FR')} F CFA`}
        </button>
      </div>

      {historique.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>Historique</p>
          {historique.map((h, i) => (
            <div key={i} style={styles.histItem}>
              <span>{h.montant_fcfa.toLocaleString('fr-FR')} F CFA</span>
              <span style={{ ...styles.histStatut, color: h.statut === 'paye' ? COLORS.teal : h.statut === 'refuse' ? COLORS.terracotta : COLORS.marigold }}>
                {h.statut === 'paye' ? 'Payé' : h.statut === 'refuse' ? 'Refusé' : 'En attente'}
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
  balanceCard: { background: COLORS.marigold, margin: '18px 20px 0', borderRadius: 16, padding: '20px', textAlign: 'center' },
  balanceLabel: { fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: 0, opacity: 0.8 },
  balanceValue: { fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 900, color: COLORS.ink, margin: '4px 0' },
  balanceFcfa: { fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: 0 },
  section: { padding: '18px 20px 4px' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: COLORS.ink },
  p: { fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5, margin: '0 0 12px' },
  linkBox: { background: '#fff', borderRadius: 10, padding: '10px 12px', marginBottom: 10, overflow: 'hidden' },
  linkText: { fontSize: 11.5, color: COLORS.indigo, wordBreak: 'break-all' },
  shareBtn: { width: '100%', background: COLORS.indigo, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  withdrawBtn: { width: '100%', background: COLORS.teal, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error: { color: COLORS.terracotta, fontSize: 12.5, fontWeight: 600, margin: '0 0 8px' },
  success: { color: COLORS.teal, fontSize: 12.5, fontWeight: 600, margin: '0 0 8px' },
  histItem: { display: 'flex', justifyContent: 'space-between', background: COLORS.card, borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 12.5, fontWeight: 600 },
  histStatut: { fontWeight: 700 },
}
