import { useState } from 'react'
import { supabase } from '../supabaseClient'
import WelcomeModal from '../components/WelcomeModal.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY, GRADIENTS, SHADOWS } from '../constants.js'

export default function SignupPage({ onSuccess, goToLogin }) {
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', entreprise: '', numero: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.email || !form.password || !form.nom || !form.prenom || !form.numero) {
      setError('Merci de remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nom: form.nom, prenom: form.prenom, entreprise: form.entreprise, numero: form.numero },
      },
    })

    if (signupError) {
      setLoading(false)
      setError(signupError.message)
      return
    }

    if (data?.user) {
      try {
        const params = new URLSearchParams(window.location.search)
        const refCode = params.get('ref')
        let ip = null
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json')
          const ipData = await ipRes.json()
          ip = ipData.ip
        } catch (_) { ip = null }
        await supabase.rpc('apply_referral', { new_user_id: data.user.id, ref_code: refCode, user_ip: ip })
      } catch (_) {}
    }

    setLoading(false)
    onSuccess?.(data)
  }

  return (
    <div style={styles.page}>
      <WelcomeModal />

      <div style={styles.header}>
        <div style={styles.glow} />
        <div style={styles.brand}>
          Gain<span style={{ color: COLORS.marigold }}>Pay</span>
        </div>
        <p style={styles.subtitle}>Crée ton compte pour publier et trouver des clients.</p>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} placeholder="toi@exemple.com" delay={0} />
        <Field label="Mot de passe" type="password" value={form.password} onChange={handleChange('password')} placeholder="8 caractères minimum" delay={40} />

        <div style={{ display: 'flex', gap: 12, animation: `gp-fade-up 0.4s ease 80ms both` }}>
          <Field label="Prénom" value={form.prenom} onChange={handleChange('prenom')} placeholder="Kofi" noAnim />
          <Field label="Nom" value={form.nom} onChange={handleChange('nom')} placeholder="Mensah" noAnim />
        </div>

        <Field label="Nom de l'entreprise (optionnel)" value={form.entreprise} onChange={handleChange('entreprise')} placeholder="Ma boutique" delay={120} />
        <Field label="Numéro de téléphone" type="tel" value={form.numero} onChange={handleChange('numero')} placeholder="+228 90 00 00 00" delay={160} />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Création en cours...' : "Créer mon compte"}
        </button>

        <p style={styles.loginLink}>
          Déjà un compte ?{' '}
          <span style={{ color: COLORS.indigo, fontWeight: 700, cursor: 'pointer' }} onClick={goToLogin}>
            Se connecter
          </span>
        </p>
      </form>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, delay = 0, noAnim }) {
  return (
    <label style={{ ...styles.fieldWrapper, animation: noAnim ? 'none' : `gp-fade-up 0.4s ease ${delay}ms both` }}>
      <span style={styles.label}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
    </label>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column' },
  header: {
    background: GRADIENTS.hero, padding: '40px 24px 46px', borderRadius: '0 0 32px 32px', color: '#fff',
    position: 'relative', overflow: 'hidden', boxShadow: SHADOWS.lifted,
  },
  glow: { position: 'absolute', inset: 0, background: GRADIENTS.marigoldGlow, animation: 'gp-glow 4s ease-in-out infinite' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 28, position: 'relative' },
  subtitle: { marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.8)', position: 'relative' },
  form: { padding: '26px 24px 60px', display: 'flex', flexDirection: 'column', gap: 14, marginTop: -18 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: {
    background: '#fff', border: '1px solid #E3DFD3', borderRadius: 12, padding: '13px 14px',
    fontSize: 14, outline: 'none', fontFamily: FONT_BODY, boxShadow: SHADOWS.soft,
  },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
  submitBtn: {
    marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 14,
    padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: SHADOWS.button,
  },
  loginLink: { textAlign: 'center', fontSize: 13, color: '#6b6559', marginTop: 4 },
}
