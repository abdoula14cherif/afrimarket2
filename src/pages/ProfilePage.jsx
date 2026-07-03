import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function ProfilePage({ user, onNavigate, onLogout }) {
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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
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
          <Field label="Prénom" value={form.prenom} onChange={handleChange('prenom')} />
          <Field label="Nom" value={form.nom} onChange={handleChange('nom')} />
        </div>
        <Field label="Nom de l'entreprise" value={form.entreprise || ''} onChange={handleChange('entreprise')} placeholder="Optionnel" />
        <Field label="Numéro de téléphone" value={form.numero} onChange={handleChange('numero')} />
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}
        <button type="submit" disabled={saving} style={styles.saveBtn}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#8b8578', cursor: 'pointer' }} onClick={() => onNavigate?.('legal')}>
          CGU · Confidentialité · À propos
        </span>
      </div>

      <div style={styles.logoutWrapper}>
        <span style={styles.logoutBtn} onClick={handleLogout}>Se déconnecter</span>
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.label}>{label}</span>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
    </label>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '32px 20px 28px', borderRadius: '0 0 28px 28px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: '50%', background: COLORS.marigold, color: COLORS.ink, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18 },
  email: { fontSize: 12, color: '#E4E1F2', marginTop: 2 },
  badge: { fontSize: 11, fontWeight: 700, color: '#fff', padding: '4px 10px', borderRadius: 12, marginTop: 8 },
  verifyBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLORS.marigold, margin: '16px 20px 0', borderRadius: 12, padding: '12px 16px', cursor: 'pointer' },
  verifyBannerText: { fontSize: 12.5, fontWeight: 700, color: COLORS.ink },
  verifyBannerArrow: { fontSize: 14, fontWeight: 700, color: COLORS.ink },
  form: { padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
  success: { color: COLORS.teal, fontSize: 13, fontWeight: 600, margin: 0 },
  saveBtn: { marginTop: 6, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  logoutWrapper: { textAlign: 'center', paddingBottom: 20 },
  logoutBtn: { fontSize: 13, color: COLORS.terracotta, fontWeight: 700, cursor: 'pointer' },
}
