import { useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const CATEGORIES = [
  { key: 'telephones', label: 'Téléphones', color: COLORS.terracotta },
  { key: 'services', label: 'Services', color: COLORS.teal },
  { key: 'mode', label: 'Mode', color: COLORS.clay },
  { key: 'maison', label: 'Maison', color: COLORS.marigold },
  { key: 'autres', label: 'Autres', color: '#6C6396' },
]

export default function PublishPage({ user, onNavigate }) {
  const [form, setForm] = useState({ titre: '', description: '', prix: '', ville: '', categorie: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.titre || !form.prix || !form.ville || !form.categorie) {
      setError('Titre, prix, ville et catégorie sont obligatoires.')
      return
    }

    setSaving(true)
    const { error: insertError } = await supabase.from('annonces').insert({
      user_id: user.id,
      titre: form.titre,
      description: form.description,
      prix: Number(form.prix),
      categorie: form.categorie,
      ville: form.ville,
    })
    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onNavigate?.('dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Publier une annonce</div>
        <p style={styles.subtitle}>Produit ou service, en quelques infos.</p>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <Field label="Titre" value={form.titre} onChange={handleChange('titre')} placeholder="Ex: iPhone 11 64Go, bon état" />
        <Field label="Description" value={form.description} onChange={handleChange('description')} placeholder="Détaille ton produit ou service" textarea />
        <div style={styles.row}>
          <Field label="Prix (FCFA)" value={form.prix} onChange={handleChange('prix')} placeholder="15000" type="number" />
          <Field label="Ville" value={form.ville} onChange={handleChange('ville')} placeholder="Lomé" />
        </div>

        <div>
          <span style={styles.label}>Catégorie</span>
          <div style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                onClick={() => setForm((prev) => ({ ...prev, categorie: cat.key }))}
                style={{
                  ...styles.chip,
                  background: cat.color,
                  color: cat.key === 'maison' ? COLORS.ink : '#fff',
                  outline: form.categorie === cat.key ? `2px solid ${COLORS.ink}` : 'none',
                  outlineOffset: 2,
                }}
              >
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={saving} style={styles.submitBtn}>
          {saving ? 'Publication...' : "Publier l'annonce"}
        </button>
      </form>

      <BottomNav active="publish" onNavigate={onNavigate} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.label}>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
      )}
    </label>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 32px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  form: { padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY },
  catRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  chip: { padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
  submitBtn: { marginTop: 6, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
}
