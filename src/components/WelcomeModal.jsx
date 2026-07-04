import { useEffect, useState } from 'react'
import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS } from '../constants.js'

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('gp_welcome_seen')
    if (!seen) {
      setVisible(true)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem('gp_welcome_seen', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.glow} />
        <span style={styles.wave}>👋</span>
        <p style={styles.title}>
          Bienvenue sur Gain<span style={{ color: COLORS.marigold }}>Pay</span>
        </p>
        <p style={styles.text}>
          Le marketplace pensé pour l'Afrique : publie ton produit ou service, trouve des clients,
          et contacte directement par WhatsApp. Simple, rapide, sans complications.
        </p>
        <div style={styles.pillsRow}>
          <span style={styles.pill}>📢 Publie en 2 min</span>
          <span style={styles.pill}>💬 Contact direct</span>
          <span style={styles.pill}>🎁 Gagne en parrainant</span>
        </div>
        <button style={styles.closeBtn} onClick={handleClose}>C'est parti !</button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(24,20,51,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 20, animation: 'gp-fade-up 0.3s ease both',
  },
  modal: {
    background: 'linear-gradient(135deg, #181433 0%, #2B2560 55%, #3E3679 100%)', color: '#fff', borderRadius: 24, padding: '32px 24px 26px',
    maxWidth: 360, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)', fontFamily: FONT_BODY,
  },
  glow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 10%, rgba(242,169,59,0.35), transparent 55%)', animation: 'gp-glow 4s ease-in-out infinite' },
  wave: { fontSize: 40, display: 'block', marginBottom: 8, position: 'relative' },
  title: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 21, margin: '0 0 12px', position: 'relative' },
  text: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 18px', position: 'relative' },
  pillsRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 22, position: 'relative' },
  pill: { fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 20 },
  closeBtn: {
    background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12,
    padding: '13px 30px', fontSize: 14, fontWeight: 700, cursor: 'pointer', position: 'relative',
  },
}
