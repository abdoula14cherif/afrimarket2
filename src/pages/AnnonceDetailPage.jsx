import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import AvisModal from '../components/AvisModal.jsx'
import SignalementModal from '../components/SignalementModal.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function AnnonceDetailPage({ annonceId, user, onNavigate }) {
  const [annonce, setAnnonce] = useState(null)
  const [seller, setSeller] = useState(null)
  const [avis, setAvis] = useState([])
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [annonceId])

  async function loadDetail() {
    setLoading(true)
    setError(false)

    const { data: item, error: itemError } = await supabase
      .from('annonces')
      .select('*')
      .eq('id', annonceId)
      .single()

    if (itemError || !item) {
      setError(true)
      setLoading(false)
      return
    }
    setAnnonce(item)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('prenom, nom, entreprise, verified')
      .eq('id', item.user_id)
      .single()
    setSeller(profileData)

    const { data: avisData } = await supabase
      .from('avis')
      .select('note, commentaire, created_at, auteur_id, profiles(prenom)')
      .eq('annonce_id', annonceId)
      .order('created_at', { ascending: false })
    setAvis(avisData || [])

    if (user?.id) {
      const { data: fav } = await supabase.from('favoris').select('user_id').eq('user_id', user.id).eq('annonce_id', annonceId).maybeSingle()
      setIsFav(!!fav)
    }

    setLoading(false)
  }

  const handleContact = () => {
    if (!annonce?.contact) return
    supabase.from('contacts_log').insert({ annonce_id: annonce.id })
    const digits = annonce.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const toggleFavori = async () => {
    if (!user?.id) return
    if (isFav) {
      setIsFav(false)
      await supabase.from('favoris').delete().eq('user_id', user.id).eq('annonce_id', annonceId)
    } else {
      setIsFav(true)
      await supabase.from('favoris').insert({ user_id: user.id, annonce_id: annonceId })
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}?annonce=${annonceId}`
    if (navigator.share) {
      navigator.share({ title: annonce.titre, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien copié !')
    }
  }

  if (loading) {
    return <div style={{ padding: 24, fontFamily: FONT_BODY }}>Chargement...</div>
  }

  if (error || !annonce) {
    return (
      <div style={styles.page}>
        <ErrorState message="Cette annonce est introuvable ou a été supprimée." onRetry={() => onNavigate?.('explore')} />
        <BottomNav active="explore" onNavigate={onNavigate} />
      </div>
    )
  }

  const avgNote = avis.length ? (avis.reduce((a, b) => a + b.note, 0) / avis.length).toFixed(1) : null

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('explore')}>← Retour</span>
        <div style={styles.topActions}>
          <span onClick={handleShare} style={styles.topIcon}>📤</span>
          <span onClick={toggleFavori} style={styles.topIcon}>{isFav ? '❤️' : '🤍'}</span>
          <span onClick={() => setShowReport(true)} style={styles.topIcon}>🚩</span>
        </div>
      </div>

      <div style={styles.imgWrapper}>
        {annonce.photo_url ? (
          <img src={annonce.photo_url} alt={annonce.titre} style={styles.img} />
        ) : (
          <span style={styles.imgFallback}>{CATEGORY_EMOJI[annonce.categorie] || '🛍️'}</span>
        )}
      </div>

      <div style={styles.content}>
        <p style={styles.title}>{annonce.titre}</p>
        <p style={styles.price}>{annonce.prix?.toLocaleString('fr-FR')} F CFA</p>
        <p style={styles.location}>📍 {annonce.ville}{avgNote && <span style={styles.noteBadge}> · ⭐ {avgNote} ({avis.length})</span>}</p>

        {annonce.description && (
          <div style={styles.section}>
            <p style={styles.sectionTitle}>Description</p>
            <p style={styles.description}>{annonce.description}</p>
          </div>
        )}

        <div style={styles.sellerCard}>
          <div style={styles.sellerAvatar}>{seller?.prenom?.[0]?.toUpperCase() || '👤'}</div>
          <div style={{ flex: 1 }}>
            <p style={styles.sellerName}>
              {seller?.entreprise || `${seller?.prenom || ''} ${seller?.nom || ''}`}
              {seller?.verified && <span style={styles.verifiedTag}> ✅</span>}
            </p>
            <p style={styles.sellerSub}>{seller?.verified ? 'Vendeur vérifié' : 'Vendeur non vérifié'}</p>
          </div>
        </div>

        <button style={styles.contactBtn} onClick={handleContact}>💬 Contacter sur WhatsApp</button>
        {user && <span style={styles.rateLink} onClick={() => setShowRating(true)}>Laisser un avis</span>}

        <div style={styles.section}>
          <p style={styles.sectionTitle}>Avis ({avis.length})</p>
          {avis.length === 0 && <p style={styles.noAvis}>Aucun avis pour l'instant.</p>}
          {avis.map((a, i) => (
            <div key={i} style={styles.avisItem}>
              <p style={styles.avisStars}>{'⭐'.repeat(a.note)}</p>
              {a.commentaire && <p style={styles.avisComment}>{a.commentaire}</p>}
              <p style={styles.avisAuteur}>{a.profiles?.prenom || 'Utilisateur'}</p>
            </div>
          ))}
        </div>
      </div>

      {showRating && <AvisModal annonce={annonce} user={user} onClose={() => setShowRating(false)} onSubmitted={loadDetail} />}
      {showReport && <SignalementModal annonce={annonce} user={user} onClose={() => setShowReport(false)} />}

      <BottomNav active="explore" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff' },
  backBtn: { fontSize: 13, fontWeight: 700, color: COLORS.indigo, cursor: 'pointer' },
  topActions: { display: 'flex', gap: 14, fontSize: 18 },
  topIcon: { cursor: 'pointer' },
  imgWrapper: { height: 260, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  imgFallback: { fontSize: 60 },
  content: { padding: '20px' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, margin: '0 0 6px', color: COLORS.ink },
  price: { fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: COLORS.indigo, margin: '0 0 6px' },
  location: { fontSize: 12.5, color: COLORS.muted, margin: '0 0 18px' },
  noteBadge: { color: COLORS.marigold, fontWeight: 700 },
  section: { marginTop: 20 },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: COLORS.ink },
  description: { fontSize: 13, color: COLORS.ink, lineHeight: 1.6, margin: 0 },
  sellerCard: { display: 'flex', alignItems: 'center', gap: 12, background: COLORS.card, borderRadius: 14, padding: '12px 14px', marginTop: 18, boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  sellerAvatar: { width: 40, height: 40, borderRadius: '50%', background: COLORS.marigold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: COLORS.ink, flexShrink: 0 },
  sellerName: { fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.ink },
  verifiedTag: { fontSize: 11 },
  sellerSub: { fontSize: 11, color: COLORS.muted, margin: '2px 0 0' },
  contactBtn: { width: '100%', marginTop: 16, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  rateLink: { display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: COLORS.indigoSoft, fontWeight: 600, cursor: 'pointer' },
  noAvis: { fontSize: 12.5, color: COLORS.muted },
  avisItem: { background: COLORS.card, borderRadius: 12, padding: '10px 14px', marginBottom: 8 },
  avisStars: { fontSize: 12, margin: '0 0 4px' },
  avisComment: { fontSize: 12.5, color: COLORS.ink, margin: '0 0 4px' },
  avisAuteur: { fontSize: 11, color: COLORS.muted, margin: 0 },
}
