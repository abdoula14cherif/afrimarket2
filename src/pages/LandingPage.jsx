import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS, SHADOWS } from '../constants.js'

const CATEGORY_EMOJI = { telephones: '📱', services: '🔧', mode: '👗', maison: '🏠', autres: '🛍️' }

export default function LandingPage({ onNavigate }) {
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState({ annonces: 0, vendeurs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: recent } = await supabase
      .from('annonces')
      .select('id, titre, prix, ville, photo_url, categorie')
      .order('created_at', { ascending: false })
      .limit(6)
    setFeatured(recent || [])

    const { count: annoncesCount } = await supabase.from('annonces').select('id', { count: 'exact', head: true })
    const { count: vendeursCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    setStats({ annonces: annoncesCount || 0, vendeurs: vendeursCount || 0 })

    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.glow} />
        <div style={styles.heroTop}>
          <div style={styles.brand}>Gain<span style={{ color: COLORS.marigold }}>Pay</span></div>
          <span style={styles.loginLink} onClick={() => onNavigate?.('login')}>Se connecter</span>
        </div>

        <p style={styles.headline}>Vends. Trouve.<br />Contacte direct.</p>
        <p style={styles.subheadline}>La marketplace pensée pour l'Afrique — publie ton produit ou service, trouve des clients, sans complications.</p>

        <div style={styles.heroCtas}>
          <button style={styles.primaryCta} onClick={() => onNavigate?.('signup')}>Créer mon compte gratuit</button>
          <button style={styles.secondaryCta} onClick={() => onNavigate?.('explore')}>Explorer sans compte</button>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <p style={styles.statValue}>{stats.annonces}+</p>
            <p style={styles.statLabel}>Annonces</p>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <p style={styles.statValue}>{stats.vendeurs}+</p>
            <p style={styles.statLabel}>Vendeurs</p>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <p style={styles.statValue}>100%</p>
            <p style={styles.statLabel}>Gratuit</p>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Comment ça marche</p>
        <div style={styles.stepsRow}>
          <Step icon="📢" title="Publie" text="Ton produit ou service en 2 minutes" />
          <Step icon="👀" title="Sois vu" text="Des milliers de personnes cherchent près de chez toi" />
          <Step icon="💬" title="Contacte" text="Direct par WhatsApp, sans intermédiaire" />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeadRow}>
          <p style={styles.sectionTitle}>Annonces en vedette</p>
          <span style={styles.seeAll} onClick={() => onNavigate?.('explore')}>Tout voir</span>
        </div>

        {loading && <p style={styles.emptyText}>Chargement...</p>}
        {!loading && featured.length === 0 && <p style={styles.emptyText}>Sois le premier à publier !</p>}

        <div style={styles.grid}>
          {featured.map((item, i) => (
            <div key={item.id} style={{ ...styles.card, animation: `gp-fade-up 0.5s ease ${i * 60}ms both` }} onClick={() => onNavigate?.('annonce-detail', item.id)}>
              <div style={styles.cardImg}>
                {item.photo_url ? <img src={item.photo_url} alt={item.titre} style={styles.cardImgTag} /> : <span style={styles.cardImgFallback}>{CATEGORY_EMOJI[item.categorie] || '🛍️'}</span>}
              </div>
              <div style={styles.cardBody}>
                <p style={styles.cardTitle}>{item.titre}</p>
                <p style={styles.cardLoc}>📍 {item.ville}</p>
                <span style={styles.priceTag}>{item.prix?.toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.finalCta}>
        <p style={styles.finalCtaTitle}>Prêt à commencer ?</p>
        <p style={styles.finalCtaText}>Rejoins des milliers de vendeurs et acheteurs déjà sur GainPay.</p>
        <button style={styles.primaryCta} onClick={() => onNavigate?.('signup')}>Créer mon compte gratuit</button>
      </div>

      <div style={styles.footer}>
        <span onClick={() => onNavigate?.('legal')} style={styles.footerLink}>CGU · Confidentialité · À propos</span>
      </div>
    </div>
  )
}

function Step({ icon, title, text }) {
  return (
    <div style={styles.step}>
      <span style={styles.stepIcon}>{icon}</span>
      <p style={styles.stepTitle}>{title}</p>
      <p style={styles.stepText}>{text}</p>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY },
  hero: { background: GRADIENTS.hero, padding: '28px 20px 40px', position: 'relative', overflow: 'hidden', color: '#fff' },
  glow: { position: 'absolute', inset: 0, background: GRADIENTS.marigoldGlow, animation: 'gp-glow 4s ease-in-out infinite' },
  heroTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: 30 },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22 },
  loginLink: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' },
  headline: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 34, lineHeight: 1.15, margin: '0 0 14px', position: 'relative' },
  subheadline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 26px', maxWidth: 320, position: 'relative' },
  heroCtas: { display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', marginBottom: 30 },
  primaryCta: { background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: SHADOWS.button },
  secondaryCta: { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 10px' },
  statItem: { textAlign: 'center' },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, margin: 0 },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' },
  statDivider: { width: 1, height: 30, background: 'rgba(255,255,255,0.2)' },
  section: { padding: '30px 20px 4px' },
  sectionHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' },
  seeAll: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft, cursor: 'pointer' },
  stepsRow: { display: 'flex', flexDirection: 'column', gap: 14 },
  step: { background: COLORS.card, borderRadius: 16, padding: '16px', boxShadow: SHADOWS.soft, display: 'flex', flexDirection: 'column', gap: 4 },
  stepIcon: { fontSize: 26 },
  stepTitle: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: COLORS.ink, margin: 0 },
  stepText: { fontSize: 12, color: COLORS.muted, margin: 0 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  card: { background: COLORS.card, borderRadius: 18, overflow: 'hidden', boxShadow: SHADOWS.soft, cursor: 'pointer' },
  cardImg: { height: 105, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardImgTag: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { fontSize: 32 },
  cardBody: { padding: '10px 12px 12px' },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, minHeight: 34, color: COLORS.ink },
  cardLoc: { fontSize: 11, color: COLORS.muted, margin: '0 0 6px' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: COLORS.indigo },
  finalCta: { margin: '36px 20px', background: GRADIENTS.hero, borderRadius: 20, padding: '30px 24px', textAlign: 'center', color: '#fff' },
  finalCtaTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, margin: '0 0 8px' },
  finalCtaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' },
  footer: { textAlign: 'center', padding: '10px 20px 40px' },
  footerLink: { fontSize: 11.5, color: COLORS.muted, cursor: 'pointer' },
}
