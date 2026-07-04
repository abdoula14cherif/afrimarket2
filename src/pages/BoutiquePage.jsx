import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ErrorState from '../components/ErrorState.jsx'
import { CardSkeletonGrid } from '../components/LoadingSkeleton.jsx'
import { COLORS, BOUTIQUE_THEMES, BOUTIQUE_FONTS } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function BoutiquePage({ slug, onNavigate }) {
  const [seller, setSeller] = useState(null)
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadBoutique()
  }, [slug])

  async function loadBoutique() {
    setLoading(true)
    setError(false)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, prenom, nom, entreprise, verified, subscription_active, boutique_theme, boutique_font')
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
      .select('id, titre, prix, ville, photo_url, contact, categorie')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })
    setAnnonces(list || [])
    setLoading(false)
  }

  const handleContact = async (item) => {
    if (!item.contact) return
    supabase.from('contacts_log').insert({ annonce_id: item.id })
    const digits = item.contact.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${digits}`, '_blank')
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: COLORS.sand }}><CardSkeletonGrid count={4} /></div>
  }

  if (error || !seller) {
    return <div style={{ minHeight: '100vh', background: COLORS.sand }}><ErrorState message="Cette boutique n'existe pas ou plus." onRetry={() => onNavigate?.('explore')} /></div>
  }

  const theme = BOUTIQUE_THEMES[seller.boutique_theme] || BOUTIQUE_THEMES.indigo
  const font = BOUTIQUE_FONTS[seller.boutique_font] || BOUTIQUE_FONTS.classique
  const displayName = seller.entreprise || `${seller.prenom} ${seller.nom}`

  return (
    <div style={{ minHeight: '100vh', background: COLORS.sand, fontFamily: font.body, paddingBottom: 40 }}>
      <div style={{ background: theme.primary, padding: '36px 20px 30px', borderRadius: '0 0 28px 28px', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontFamily: font.display, fontWeight: 900, fontSize: 26, color: theme.accent === '#F1EDE4' ? COLORS.ink : '#fff' }}>
          {displayName[0]?.toUpperCase()}
        </div>
        <p style={{ fontFamily: font.display, fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>{displayName}</p>
        {seller.verified && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>✅ Vendeur vérifié</span>}
      </div>

      <div style={{ padding: '20px' }}>
        <p style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: COLORS.ink }}>
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
        </p>
        {annonces.length === 0 && <p style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' }}>Pas encore d'annonce publiée.</p>}
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
                <button data-noclick="true" onClick={() => handleContact(item)} style={{ width: '100%', background: theme.accent, color: theme.accent === '#F1EDE4' ? COLORS.ink : '#fff', border: 'none', fontWeight: 700, fontSize: 11.5, padding: '8px 0', borderRadius: 10, cursor: 'pointer' }}>
                  💬 Contacter
                </button>
              </div>
            </div>
          ))}
        </div>

        {!seller.subscription_active && (
          <p style={{ textAlign: 'center', fontSize: 11, color: COLORS.muted, marginTop: 24 }}>
            Propulsé par <span style={{ fontWeight: 700, color: theme.primary }}>GainPay</span>
          </p>
        )}
      </div>
    </div>
  )
}
