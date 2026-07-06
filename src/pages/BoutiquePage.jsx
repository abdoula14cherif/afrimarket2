import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ErrorState from '../components/ErrorState.jsx'
import TrustBadge from '../components/TrustBadge.jsx'
import { CardSkeletonGrid } from '../components/LoadingSkeleton.jsx'
import { COLORS, BOUTIQUE_THEMES, BOUTIQUE_FONTS } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function BoutiquePage({ slug, onNavigate }) {
  const [seller, setSeller] = useState(null)
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [promoInput, setPromoInput] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [checkingPromo, setCheckingPromo] = useState(false)

  useEffect(() => {
    loadBoutique()
  }, [slug])

  const photosForCarousel = annonces.filter((a) => a.photo_url).slice(0, 6)

  useEffect(() => {
    if (photosForCarousel.length < 2) return
    const interval = setInterval(() => {
      setSlideIndex((i) => (i + 1) % photosForCarousel.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [photosForCarousel.length])

  async function loadBoutique() {
    setLoading(true)
    setError(false)

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, prenom, nom, entreprise, verified, subscription_active, boutique_theme, boutique_font, boutique_layout')
      .eq('boutique_slug', slug)
      .single()

    if (profileError || !profileData) {
      setError(true)
      setLoading(false)
      return
    }
    setSeller(profileData)

    const { data: list } = await supabase
      .from('annonces')
      .select('id, titre, description, prix, ville, photo_url, contact, categorie')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })
    setAnnonces(list || [])

    setLoading(false)
  }

  const handleContact = async (item) => {
    if (!item.contact) return
    await supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: seller.entreprise || 'Boutique GainPay', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien de la boutique copié !')
    }
  }

  const handleCheckPromo = async () => {
    if (!promoInput.trim()) return
    setCheckingPromo(true)
    setPromoResult(null)
    const { data, error: rpcError } = await supabase.rpc('use_promo_code', {
      p_user_id: seller.id,
      p_code: promoInput.trim(),
    })
    setCheckingPromo(false)
    if (rpcError || !data?.[0]) {
      setPromoResult({ valid: false, message: 'Erreur, réessaie.' })
      return
    }
    setPromoResult(data[0])
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: COLORS.sand }}><CardSkeletonGrid count={4} /></div>
  }

  if (error || !seller) {
    return <div style={{ minHeight: '100vh', background: COLORS.sand }}><ErrorState message="Cette boutique n'existe pas ou plus." onRetry={() => onNavigate?.('explore')} /></div>
  }

  const theme = BOUTIQUE_THEMES[seller.boutique_theme] || BOUTIQUE_THEMES.indigo
  const font = BOUTIQUE_FONTS[seller.boutique_font] || BOUTIQUE_FONTS.classique
  const layout = seller.boutique_layout || 'grid'
  const displayName = seller.entreprise || `${seller.prenom} ${seller.nom}`
  const accentTextColor = theme.accent === '#F1EDE4' ? COLORS.ink : '#fff'

  return (
    <div style={{ minHeight: '100vh', background: COLORS.sand, fontFamily: font.body, paddingBottom: 40 }}>
      <div style={{ position: 'relative', height: 230, overflow: 'hidden', background: theme.primary }}>
        {photosForCarousel.map((item, i) => (
          <img
            key={item.id}
            src={item.photo_url}
            alt={item.titre}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === slideIndex ? 1 : 0, transition: 'opacity 0.8s ease',
            }}
          />
        ))}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />

        <span onClick={handleShare} style={{ position: 'absolute', top: 14, right: 14, fontSize: 16, background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>📤</span>

        {photosForCarousel.length > 1 && (
          <div style={{ position: 'absolute', top: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {photosForCarousel.map((_, i) => (
              <div key={i} style={{ width: i === slideIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === slideIndex ? theme.accent : 'rgba(255,255,255,0.5)', transition: 'width 0.3s ease' }} />
            ))}
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontFamily: font.display, fontWeight: 900, fontSize: 22, color: accentTextColor, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <p style={{ fontFamily: font.display, fontWeight: 900, fontSize: 21, margin: '0 0 4px', color: '#fff' }}>{displayName}</p>
          {seller.verified && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12, fontWeight: 700, color: '#fff', marginRight: 6 }}>✅ Vendeur vérifié</span>}
          <TrustBadge userId={seller.id} size="small" />
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ background: COLORS.card, borderRadius: 14, padding: '12px 14px', marginBottom: 18, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: '0 0 8px' }}>🎟️ Un code promo ?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="CODE"
              style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', textTransform: 'uppercase' }}
            />
            <button onClick={handleCheckPromo} disabled={checkingPromo} style={{ background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              {checkingPromo ? '...' : 'Vérifier'}
            </button>
          </div>
          {promoResult && (
            <p style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: promoResult.valid ? COLORS.teal : COLORS.terracotta }}>
              {promoResult.valid
                ? `✅ ${promoResult.type === 'pourcentage' ? promoResult.valeur + '% de réduction' : promoResult.valeur.toLocaleString('fr-FR') + ' F CFA de réduction'} — montre ce code au vendeur`
                : `❌ ${promoResult.message}`}
            </p>
          )}
        </div>

        <p style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: COLORS.ink }}>
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
        </p>

        {annonces.length === 0 && <p style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' }}>Pas encore d'annonce publiée.</p>}

        {layout === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {annonces.map((item) => (
              <div key={item.id} style={{ background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', cursor: 'pointer' }} onClick={(e) => { if (e.target.closest('[data-noclick]')) return; onNavigate('annonce-detail', item.id) }}>
                <div style={{ height: 100, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30 }}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', color: COLORS.ink }}>{item.titre}</p>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: '0 0 6px' }}>📍 {item.ville}</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: theme.primary, margin: '0 0 8px' }}>{item.prix?.toLocaleString('fr-FR')} F</p>
                  <button data-noclick="true" onClick={() => handleContact(item)} style={{ width: '100%', background: theme.accent, color: accentTextColor, border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' }}>
                    💬 Contacter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'liste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {annonces.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 12, background: COLORS.card, borderRadius: 16, padding: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.06)', cursor: 'pointer' }} onClick={(e) => { if (e.target.closest('[data-noclick]')) return; onNavigate('annonce-detail', item.id) }}>
                <div style={{ width: 76, height: 76, borderRadius: 12, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26 }}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 3px', color: COLORS.ink }}>{item.titre}</p>
                  {item.description && <p style={{ fontSize: 11.5, color: COLORS.muted, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>}
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: theme.primary, margin: '0 0 6px' }}>{item.prix?.toLocaleString('fr-FR')} F · 📍 {item.ville}</p>
                  <button data-noclick="true" onClick={() => handleContact(item)} style={{ background: theme.accent, color: accentTextColor, border: 'none', fontWeight: 700, fontSize: 11, padding: '7px 16px', borderRadius: 10, cursor: 'pointer' }}>
                    💬 Contacter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'vitrine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {annonces.map((item) => (
              <div key={item.id} style={{ background: COLORS.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={(e) => { if (e.target.closest('[data-noclick]')) return; onNavigate('annonce-detail', item.id) }}>
                <div style={{ height: 190, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44 }}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <p style={{ fontFamily: font.display, fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: COLORS.ink }}>{item.titre}</p>
                  <p style={{ fontSize: 12, color: COLORS.muted, margin: '0 0 8px' }}>📍 {item.ville}</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: theme.primary, margin: '0 0 12px' }}>{item.prix?.toLocaleString('fr-FR')} F</p>
                  <button data-noclick="true" onClick={() => handleContact(item)} style={{ width: '100%', background: theme.accent, color: accentTextColor, border: 'none', fontWeight: 700, fontSize: 13, padding: '12px 0', borderRadius: 12, cursor: 'pointer' }}>
                    💬 Contacter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!seller.subscription_active && (
          <p style={{ textAlign: 'center', fontSize: 11, color: COLORS.muted, marginTop: 24 }}>
            Propulsé par{' '}
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: theme.primary, textDecoration: 'none' }}>
              GainPay
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
