import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { useTheme } from '../components/ThemeContext.jsx'
import { FONT_BODY, FONT_DISPLAY } from '../constants.js'

const ADMIN_EMAIL = 'abdoula14cherif@gmail.com'

export default function ProfilePage({ user, onNavigate, onLogout }) {
  const { colors, theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({ prenom: '', nom: '', entreprise: '', numero: '' })
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('prenom, nom, entreprise, numero, verified')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        setError("Impossible de charger le profil.")
      } else if (data) {
        setForm(data)
        setVerified(data.verified || false)
      }
      setLoading(false)
    }
    loadProfile()
  }, [user])

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!form.prenom || !form.nom || !form.numero) {
      setError('Prénom, nom et numéro sont obligatoires.')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ prenom: form.prenom, nom: form.nom, entreprise: form.entreprise, numero: form.numero })
      .eq('id', user.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setMessage('Profil mis à jour ✅')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout?.()
  }

  const styles = getStyles(colors)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.themeToggle} onClick={toggleTheme}>{theme === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}</span>
        <div style={styles.avatar}>{form.prenom ? form.prenom[0].toUpperCase() : '👤'}</div>
        <div style={styles.name}>{loading ? 'Chargement...' : `${form.prenom} ${form.nom}`}</div>
        <div style={styles.email}>{user?.email}</div>
        <span style={{ ...styles.badge, background: verified ? '#2F8F82' : 'rgba(255,255,255,0.15)' }}>
          {verified ? '✅ Vérifié' : '⚪ Non vérifié'}
        </span>
      </div>

      {verified && (
        <div style={styles.verifyBanner} onClick={() => onNavigate?.('boutique-settings')}>
          <span style={styles.verifyBannerText}>🏪 Personnaliser ma boutique</span>
          <span style={styles.verifyBannerArrow}>→</span>
        </div>
      )}

      {!verified && (
        <div style={styles.verifyBanner} onClick={() => onNavigate?.('verification')}>
          <span style={styles.verifyBannerText}>🔒 Vérifier mon compte pour publier sans limite</span>
          <span style={styles.verifyBannerArrow}>→</span>
        </div>
      )}

      <form style={styles.form} onSubmit={handleSave}>
        <div style={styles.row}>
          <Field label="Prénom" value={form.prenom} onChange={handleChange('prenom')} colors={colors} />
          <Field label="Nom" value={form.nom} onChange={handleChange('nom')} colors={colors} />
        </div>
        <Field label="Nom de l'entreprise" value={form.entreprise || ''} onChange={handleChange('entreprise')} placeholder="Optionnel" colors={colors} />
        <Field label="Numéro de téléphone" value={form.numero} onChange={handleChange('numero')} colors={colors} />
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}
        <button type="submit" disabled={saving} style={styles.saveBtn}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
        <span style={styles.legalLink} onClick={() => onNavigate?.('legal')}>
          CGU · Confidentialité · À propos
        </span>
      </div>

      <div style={styles.logoutWrapper}>
        <span style={styles.logoutBtn} onClick={handleLogout}>Se déconnecter</span>
      </div>

      {user?.email === ADMIN_EMAIL && (
        <div style={styles.adminDot} onClick={() => onNavigate?.('admin')} aria-label="admin" />
      )}

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, colors }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors.muted }}>{label}</span>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY, color: colors.ink }} />
    </label>
  )
}

function getStyles(colors) {
  return {
    page: { minHeight: '100vh', background: colors.sand, fontFamily: FONT_BODY, paddingBottom: 90, position: 'relative' },
    header: { background: colors.indigoDeep, padding: '32px 20px 28px', borderRadius: '0 0 28px 28px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
    themeToggle: { position: 'absolute', top: 16, right: 20, fontSize: 11, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontWeight: 600 },
    avatar: { width: 64, height: 64, borderRadius: '50%', background: colors.marigold, color: colors.indigoDeep, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    name: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18 },
    email: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    badge: { fontSize: 11, fontWeight: 700, color: '#fff', padding: '4px 10px', borderRadius: 12, marginTop: 8 },
    verifyBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.marigold, margin: '16px 20px 0', borderRadius: 12, padding: '12px 16px', cursor: 'pointer' },
    verifyBannerText: { fontSize: 12.5, fontWeight: 700, color: colors.indigoDeep },
    verifyBannerArrow: { fontSize: 14, fontWeight: 700, color: colors.indigoDeep },
    form: { padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
    row: { display: 'flex', gap: 12 },
    error: { color: colors.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
    success: { color: colors.teal, fontSize: 13, fontWeight: 600, margin: 0 },
    saveBtn: { marginTop: 6, background: colors.marigold, color: colors.indigoDeep, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    legalLink: { fontSize: 12, color: colors.muted, cursor: 'pointer' },
    logoutWrapper: { textAlign: 'center', paddingBottom: 30 },
    logoutBtn: { fontSize: 13, color: colors.terracotta, fontWeight: 700, cursor: 'pointer' },
    adminDot: { position: 'absolute', bottom: 78, right: 18, width: 10, height: 10, borderRadius: '50%', background: colors.border, cursor: 'pointer' },
  }
}
