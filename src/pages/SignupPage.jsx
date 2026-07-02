import { useState } from 'react'
import { supabase } from '../supabaseClient'

const COLORS = {
  sand: '#F1EDE4',
  ink: '#211E1B',
  indigo: '#2B2560',
  indigoSoft: '#3E3679',
  marigold: '#F2A93B',
  terracotta: '#D2603A',
}

export default function SignupPage({ onSuccess, goToLogin }) {
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', entreprise: '', numero: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

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
        data: {
          nom: form.nom,
          prenom: form.prenom,
          entreprise: form.entreprise,
          numero: form.numero,
        },
      },
    })
    setLoading(false)
    if (signupError) {
      setError(signupError.message)
      return
    }
    onSuccess?.(data)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>
          Gain<span style={{ color: COLORS.marigold }}>Pay</span>
        </div>
        <p style={styles.subtitle}>Crée ton compte pour publier et trouver des clients.</p>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} placeholder="toi@exemple.com" />
        <Field label="Mot de passe" type="password" value={form.password} onChange={handleChange('password')} placeholder="8 caractères minimum" />
        <div style={styles.row}>
          <Field label="Prénom" value={form.prenom} onChange={handleChange('prenom')} placeholder="Kofi" />
          <Field label="Nom" value={form.nom} onChange={handleChange('nom')} placeholder="Mensah" />
        </div>
        <Field label="Nom de l'entreprise (optionnel)" value={form.entreprise} onChange={handleChange('entreprise')} placeholder="Ma boutique" />
        <Field label="Numéro de téléphone" type="tel" value={form.numero} onChange={handleChange('numero')} placeholder="+228 90 00 00 00" />
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

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.label}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
    </label>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { background: COLORS.indigo, padding: '32px 24px 40px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: 'Fraunces, serif', fontWeight: 900, fontSize: 26 },
  subtitle: { marginTop: 8, fontSize: 14, color: '#E4E1F2' },
  form: { padding: '24px 24px 60px', display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: { background: '#fff', border: '1px solid #E3DFD3', borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
  submitBtn: { marginTop: 8, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  loginLink: { textAlign: 'center', fontSize: 13, color: '#6b6559', marginTop: 4 },
}
