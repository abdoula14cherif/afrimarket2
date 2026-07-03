import { COLORS, FONT_BODY } from '../constants.js'

export default function ErrorState({ message = "Une erreur s'est produite.", onRetry }) {
  return (
    <div style={styles.wrapper}>
      <span style={styles.icon}>⚠️</span>
      <p style={styles.text}>{message}</p>
      {onRetry && (
        <button style={styles.retryBtn} onClick={onRetry}>Réessayer</button>
      )}
    </div>
  )
}

const styles = {
  wrapper: { textAlign: 'center', padding: '40px 24px', fontFamily: FONT_BODY },
  icon: { fontSize: 32, display: 'block', marginBottom: 10 },
  text: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  retryBtn: { background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
