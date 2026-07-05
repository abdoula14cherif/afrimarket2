import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function PromoCodesPage({ user, onNavigate }) {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'pourcentage', valeur: '', limite: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCodes()
  }, [user])

  async function loadCodes() {
    if (!user?.id) return
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCodes(data || [])
    setLoading(false)
  }

  const handleChange = (field) => (e) => {
    const value = field === 'code' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreate = async () => {
    setError(null)
    if (!form.code || !form.valeur) {
      setError('Code et valeur sont obligatoires.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('promo_codes').insert({
      user_id: user.id,
      code: form.code,
      type: form.type,
      valeur: Number(form.valeur),
      limite_utilisation: form.limite ? Number(form.limite) : null,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.code === '23505' ? 'Tu as déjà un code avec ce nom.' : insertError.message)
      return
    }
    setForm({ code: '', type: 'pourcentage', valeur: '', limite: '' })
    setShowForm(false)
    loadCodes()
  }

  const toggleActif = async (code) => {
    setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, actif: !c.actif } : c)))
    await supabase.from('promo_codes').update({ actif: !code.actif }).eq('id', code.id)
  }

  const handleDelete = async (code) => {
    if (!window.confirm(`Supprimer le code ${code.code} ?`)) return
    setCodes((prev) => prev.filter((c) => c.id !== code.id))
    await supabase.from('promo_codes').delete().eq('id', code.id)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('dashboard')}>← Retour</span>
        <div style={styles.brand}>Mes codes promo</div>
        <p style={styles.subtitle}>Crée des réductions pour tes clients</p>
      </div>

      <div style={styles.content}>
        {!showForm && (
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>+ Créer un code promo</button>
        )}

        {showForm && (
          <div style={styles.formCard}>
            <Field label="Code" value={form.code} onChange={handleChange('code')} placeholder="PROMO10" />
            <div style={styles.typeRow}>
              <div onClick={() => setForm((p) => ({ ...p, type: 'pourcentage' }))} style={{ ...styles.typeChip, background: form.type === 'pourcentage' ? COLORS.indigo : '#fff', color: form.type === 'pourcentage' ? '#fff' : COLORS.ink }}>%</div>
              <div onClick={() => setForm((p) => ({ ...p, type: 'montant' }))} style={{ ...styles.typeChip, background: form.type === 'montant' ? COLORS.indigo : '#fff', color: form.type === 'montant' ? '#fff' : COLORS.ink }}>F CFA</div>
            </div>
            <Field label={form.type === 'pourcentage' ? 'Pourcentage (ex: 10)' : 'Montant en F CFA (ex: 500)'} value={form.valeur} onChange={handleChange('valeur')} placeholder="10" type="number" />
            <Field label="Limite d'utilisation (optionnel)" value={form.limite} onChange={handleChange('limite')} placeholder="Illimité si vide" type="number" />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setError(null) }}>Annuler</button>
              <button style={styles.saveBtn} onClick={handleCreate} disabled={saving}>{saving ? 'Création...' : 'Créer'}</button>
            </div>
          </div>
        )}

        {loading && <p style={styles.emptyText}>Chargement...</p>}
        {!loading && codes.length === 0 && !showForm && <p style={styles.emptyText}>Aucun code promo pour l'instant.</p>}

        <div style={styles.list}>
          {codes.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={{ flex: 1 }}>
                <p style={styles.codeText}>{c.code}</p>
                <p style={styles.codeMeta}>
                  {c.type === 'pourcentage' ? `${c.valeur}% de réduction` : `${c.valeur.toLocaleString('fr-FR')} F CFA de réduction`}
                  {c.limite_utilisation && ` · ${c.nombre_utilisations}/${c.limite_utilisation} utilisé(s)`}
                  {!c.limite_utilisation && ` · ${c.nombre_utilisations} utilisé(s)`}
                </p>
              </div>
              <div style={styles.cardActions}>
                <span onClick={() => toggleActif(c)} style={{ ...styles.statusTag, background: c.actif ? COLORS.teal : '#F1EDE4', color: c.actif ? '#fff' : COLORS.muted }}>
                  {c.actif ? 'Actif' : 'Inactif'}
                </span>
                <span onClick={() => handleDelete(c)} style={styles.deleteIcon}>🗑️</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={styles.fieldWrapper}>
      <span style={styles.label}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
    </label>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '20px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  backBtn: { fontSize: 12, fontWeight: 700, color: '#E4E1F2', cursor: 'pointer', display: 'block', marginBottom: 10 },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  content: { padding: '20px' },
  addBtn: { width: '100%', background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  formCard: { background: COLORS.card, borderRadius: 16, padding: '16px', marginBottom: 18, boxShadow: '0 4px 14px rgba(43,37,96,0.08)', display: 'flex', flexDirection: 'column', gap: 12 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY },
  typeRow: { display: 'flex', gap: 8 },
  typeChip: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  error: { color: COLORS.terracotta, fontSize: 12.5, fontWeight: 600, margin: 0 },
  formActions: { display: 'flex', gap: 10 },
  cancelBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  saveBtn: { flex: 1, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '20px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card, borderRadius: 14, padding: '12px 14px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  codeText: { fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 3px', letterSpacing: 1 },
  codeMeta: { fontSize: 11, color: COLORS.muted, margin: 0 },
  cardActions: { display: 'flex', alignItems: 'center', gap: 10 },
  statusTag: { fontSize: 10.5, fontWeight: 700, padding: '5px 10px', borderRadius: 10, cursor: 'pointer' },
  deleteIcon: { fontSize: 15, cursor: 'pointer' },
}
