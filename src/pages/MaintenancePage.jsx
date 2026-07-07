import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS } from '../constants.js'

export default function MaintenancePage({ message, onLoginClick }) {
  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <span style={styles.icon}>🛠️</span>
      <p style={styles.brand}>Gain<span style={{ color: COLORS.marigold }}>Pay</span></p>
      <p style={styles.message}>{message || 'Le site est en maintenance. On revient très vite !'}</p>
      {onLoginClick && (
        <span style={styles.loginLink} onClick={onLoginClick}>Administrateur ? Se connecter</span>
      )}
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
  loginLink: { marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', position: 'relative' },
}
