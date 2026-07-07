import { useRef, useState } from 'react'
import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS } from '../constants.js'

export default function MaintenancePage({ message, onLoginClick }) {
  const [tapCount, setTapCount] = useState(0)
  const resetTimerRef = useRef(null)

  const handleSecretTap = () => {
    const next = tapCount + 1
    setTapCount(next)

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)

    if (next >= 3) {
      setTapCount(0)
      onLoginClick?.()
      return
    }

    resetTimerRef.current = setTimeout(() => setTapCount(0), 1500)
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <span style={styles.icon}>🛠️</span>
      <p style={styles.brand}>Gain<span style={{ color: COLORS.marigold }}>Pay</span></p>
      <p style={styles.message}>{message || 'Le site est en maintenance. On revient très vite !'}</p>

      <div style={styles.dotsRow}>
        <div style={{ ...styles.dot, animationDelay: '0s' }} />
        <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
        <div style={{ ...styles.dot, animationDelay: '0.4s' }} onClick={handleSecretTap} />
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: GRADIENTS.hero, color: '#fff', fontFamily: FONT_BODY,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '0 30px', position: 'relative', overflow: 'hidden',
  },
  glow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(242,169,59,0.35), transparent 60%)', animation: 'gp-glow 4s ease-in-out infinite' },
  icon: { fontSize: 48, marginBottom: 16, position: 'relative' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 26, margin: '0 0 12px', position: 'relative' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 280, lineHeight: 1.6, position: 'relative' },
  dotsRow: { display: 'flex', gap: 8, marginTop: 30, position: 'relative' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: 'gp-pulse 1.2s ease-in-out infinite' },
}
