import { COLORS } from '../constants.js'

const NAV_ITEMS = [
  { key: 'dashboard', icon: '🏠', label: 'Accueil' },
  { key: 'publish', icon: '📢', label: 'Publier' },
  { key: 'contacts', icon: '💬', label: 'Contacts' },
  { key: 'profile', icon: '👤', label: 'Profil' },
]

export default function BottomNav({ active, onNavigate }) {
  return (
    <div style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active
        return (
          <div
            key={item.key}
            style={{ ...styles.item, color: isActive ? COLORS.indigo : COLORS.muted }}
            onClick={() => onNavigate?.(item.key)}
          >
            <span style={styles.icon}>{item.icon}</span>
            {item.label}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', justifyContent: 'space-around', padding: '12px 0 16px', borderTop: `1px solid ${COLORS.border}` },
  item: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, cursor: 'pointer' },
  icon: { fontSize: 18 },
}
