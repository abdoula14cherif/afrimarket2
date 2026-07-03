import { COLORS } from '../constants.js'

export function CardSkeletonGrid({ count = 4 }) {
  return (
    <div style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.img} />
          <div style={styles.line1} />
          <div style={styles.line2} />
          <div style={styles.line3} />
        </div>
      ))}
    </div>
  )
}

const pulse = {
  animation: 'gp-pulse 1.4s ease-in-out infinite',
  background: '#E7E0D2',
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 20px' },
  card: { background: COLORS.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(43,37,96,0.06)', padding: 10 },
  img: { ...pulse, height: 100, borderRadius: 10, marginBottom: 10 },
  line1: { ...pulse, height: 12, borderRadius: 6, marginBottom: 6, width: '80%' },
  line2: { ...pulse, height: 10, borderRadius: 6, marginBottom: 10, width: '50%' },
  line3: { ...pulse, height: 30, borderRadius: 8, width: '100%' },
}
