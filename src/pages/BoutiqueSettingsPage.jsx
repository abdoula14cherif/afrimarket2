import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY, BOUTIQUE_THEMES, BOUTIQUE_FONTS, BOUTIQUE_LAYOUTS } from '../constants.js'

export default function BoutiqueSettingsPage({ user, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [slug, setSlug] = useState('')
  const [theme, setTheme] = useState('indigo')
  const [font, setFont] = useState('classique')
  const [layout, setLayout] = useState('grid')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [payingLoading, setPayingLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      const { data } = await supabase
        .from('profiles')
        .select('verified, subscription_active, boutique_slug, boutique_theme, boutique_font, boutique_layout')
        .eq('id', user.id)
        .single()
      if (data) {
        setVerified(data.verified || false)
        setSubscriptionActive(data.subscription_active || false)
        setSlug(data.boutique_slug || '')
        setTheme(data.boutique_theme || 'indigo')
        setFont(data.boutique_font || 'classique')
        setLayout(data.boutique_layout || 'grid')
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSlugChange = (e) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    setSlug(clean)
  }

  const handleSave = async () => {
    setError(null)
    setMessage(null)
    if (!slug || slug.length < 3) {
      setError('Choisis un lien de boutique valide (3 caractères minimum).')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ boutique_slug: slug, boutique_theme: theme, boutique_font: font, boutique_layout: layout })
      .eq('id', user.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.code === '23505' ? 'Ce lien est déjà pris, choisis-en un autre.' : updateError.message)
      return
    }
    setMessage('Boutique enregistrée ✅')
  }

  const handlePassPro = async () => {
    setPayingLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          id: user.id,
          amount: 2000,
          description: 'GainPay - Abonnement Pro boutique (1 mois)',
        }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        setError(data.error || 'Erreur lors de la creation du paiement.')
      }
    } catch (err) {
      setError('Erreur reseau, reessaie.')
    }
    setPayingLoading(false)
  }

  if (loading) return <div style={{ padding: 24, fontFamily: FONT_BODY }}>Chargement...</div>

  if (!verified) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <span style={styles.backBtn} onClick={() => onNavigate?.('profile')}>← Retour</span>
          <div style={styles.brand}>Boutique perso</div>
        </div>
        <div style={styles.lockedBox}>
          <span style={{ fontSize: 34 }}>🔒</span>
          <p style={styles.lockedText}>La boutique perso est réservée aux comptes vérifiés.</p>
          <button style={styles.primaryBtn} onClick={() => onNavigate?.('verification')}>Vérifier mon compte</button>
        </div>
        <BottomNav active="profile" onNavigate={onNavigate} />
      </div>
    )
  }

  const themePreview = BOUTIQUE_THEMES[theme]
  const fontPreview = BOUTIQUE_FONTS[font]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('profile')}>← Retour</span>
        <div style={styles.brand}>Ma boutique perso</div>
      </div>

      <div style={styles.content}>
        <span style={styles.label}>Lien de ta boutique</span>
        <span style={styles.slugPrefix}>gainpaye.vercel.app/boutique/</span>
        <input value={slug} onChange={handleSlugChange} placeholder="ma-boutique" style={styles.input} />

        <span style={styles.label}>Structure de la page</span>
        <div style={styles.layoutRow}>
          {Object.entries(BOUTIQUE_LAYOUTS).map(([key, l]) => (
            <div key={key} onClick={() => setLayout(key)} style={{ ...styles.layoutCard, outline: layout === key ? `2px solid ${COLORS.ink}` : 'none' }}>
              <p style={styles.layoutLabel}>{l.label}</p>
              <p style={styles.layoutDesc}>{l.description}</p>
            </div>
          ))}
        </div>

        <span style={styles.label}>Thème de couleur</span>
        <div style={styles.themeGrid}>
          {Object.entries(BOUTIQUE_THEMES).map(([key, t]) => (
            <div key={key} onClick={() => setTheme(key)} style={{ ...styles.themeSwatch, outline: theme === key ? `3px solid ${COLORS.ink}` : 'none' }}>
              <div style={{ ...styles.swatchHalf, background: t.primary }} />
              <div style={{ ...styles.swatchHalf, background: t.accent }} />
              <span style={styles.themeLabel}>{t.label}</span>
            </div>
          ))}
        </div>

        <span style={styles.label}>Police</span>
        <div style={styles.fontGrid}>
          {Object.entries(BOUTIQUE_FONTS).map(([key, f]) => (
            <div key={key} onClick={() => setFont(key)} style={{ ...styles.fontChip, outline: font === key ? `2px solid ${COLORS.ink}` : 'none', fontFamily: f.display }}>
              {f.label}
            </div>
          ))}
        </div>

        <div style={{ ...styles.preview, background: themePreview.primary, fontFamily: fontPreview.display }}>
          <p style={{ ...styles.previewTitle, color: '#fff' }}>Ma Boutique</p>
          <span style={{ ...styles.previewBadge, background: themePreview.accent, color: themePreview.accent === '#F1EDE4' ? COLORS.ink : '#fff' }}>Aperçu</span>
        </div>

        {!subscriptionActive && (
          <div style={styles.subBanner}>
            <span style={styles.subBannerText}>💎 Passe Pro pour retirer "Propulsé par GainPay" de ta boutique</span>
            <span style={styles.subBannerTag}>2 000 F CFA / mois</span>
            <button style={styles.payBtn} onClick={handlePassPro} disabled={payingLoading}>
              {payingLoading ? 'Redirection...' : 'Passer Pro maintenant'}
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer ma boutique'}
        </button>

        {slug && (
          <>
            <span style={styles.viewLink} onClick={() => onNavigate?.('boutique', slug)}>Voir ma boutique publique →</span>
            <div style={styles.qrBox}>
              <p style={styles.qrLabel}>QR code de ta boutique</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '?boutique=' + slug)}`}
                alt="QR code boutique"
                style={styles.qrImg}
              />
              <span style={styles.qrHint}>Fais-le scanner sur ta carte de visite ou en boutique</span>
            </div>
          </>
        )}
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '20px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  backBtn: { fontSize: 12, fontWeight: 700, color: '#E4E1F2', cursor: 'pointer', display: 'block', marginBottom: 10 },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19 },
  content: { padding: '20px' },
  label: { fontSize: 12, fontWeight: 700, color: COLORS.indigoSoft, display: 'block', marginTop: 18, marginBottom: 8 },
  slugPrefix: { fontSize: 11, color: COLORS.muted, display: 'block', marginBottom: 4 },
  input: { width: '100%', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY, boxSizing: 'border-box' },
  layoutRow: { display: 'flex', gap: 8 },
  layoutCard: { flex: 1, background: '#fff', borderRadius: 12, padding: '12px 10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  layoutLabel: { fontSize: 12.5, fontWeight: 700, color: COLORS.ink, margin: '0 0 2px' },
  layoutDesc: { fontSize: 10, color: COLORS.muted, margin: 0 },
  themeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  themeSwatch: { borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  swatchHalf: { height: 28 },
  themeLabel: { display: 'block', fontSize: 11, fontWeight: 700, padding: '6px 10px', color: COLORS.ink },
  fontGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  fontChip: { textAlign: 'center', background: '#fff', borderRadius: 10, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  preview: { marginTop: 20, borderRadius: 16, padding: '24px 20px', textAlign: 'center' },
  previewTitle: { fontSize: 20, fontWeight: 900, margin: '0 0 10px' },
  previewBadge: { fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 12 },
  subBanner: { marginTop: 18, background: '#fff', border: `1.5px dashed ${COLORS.marigold}`, borderRadius: 12, padding: '12px 14px' },
  subBannerText: { display: 'block', fontSize: 12.5, fontWeight: 700, color: COLORS.ink },
  subBannerTag: { display: 'block', fontSize: 11, color: COLORS.muted, marginTop: 4 },
  payBtn: { width: '100%', marginTop: 12, background: COLORS.indigo, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, marginTop: 12 },
  success: { color: COLORS.teal, fontSize: 13, fontWeight: 600, marginTop: 12 },
  primaryBtn: { width: '100%', marginTop: 18, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  viewLink: { display: 'block', textAlign: 'center', marginTop: 14, fontSize: 13, fontWeight: 700, color: COLORS.indigo, cursor: 'pointer' },
  lockedBox: { background: COLORS.card, margin: '20px', borderRadius: 16, padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 14px rgba(43,37,96,0.08)' },
  lockedText: { fontSize: 13, color: COLORS.muted, margin: '12px 0 18px', lineHeight: 1.5 },
  qrBox: { textAlign: 'center', marginTop: 20, background: COLORS.card, borderRadius: 16, padding: '18px' },
  qrLabel: { fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: '0 0 12px' },
  qrImg: { width: 160, height: 160, borderRadius: 10 },
  qrHint: { display: 'block', fontSize: 11, color: COLORS.muted, marginTop: 10 },
}
