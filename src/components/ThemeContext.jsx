import { createContext, useContext, useEffect, useState } from 'react'
import { LIGHT_COLORS, DARK_COLORS } from '../constants.js'

const ThemeContext = createContext(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  return ctx || { theme: 'dark', colors: DARK_COLORS, toggleTheme: () => {} }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('gp_theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('gp_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
