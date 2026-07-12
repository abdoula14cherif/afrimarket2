import { createContext, useCallback, useContext, useState } from 'react'
import { COLORS, FONT_BODY } from '../constants.js'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx?.showToast || (() => {})
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.wrapper}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, background: t.type === 'error' ? COLORS.terracotta : COLORS.indigo }}>
            {t.type === 'error' ? '⚠️' : '✅'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const styles = {
  wrapper: {
    position: 'fixed', bottom: 90, left: 0, right: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    zIndex: 200, pointerEvents: 'none', padding: '0 20px',
  },
  toast: {
    color: '#fff', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
    padding: '11px 18px', borderRadius: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    animation: 'gp-fade-up 0.3s ease both', maxWidth: '90%', textAlign: 'center',
  },
}
