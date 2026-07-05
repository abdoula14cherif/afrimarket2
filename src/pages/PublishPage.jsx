import { useState, useEffect } from 'react'
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

const MAX_PHOTOS = 4

export default function PublishPage({ user, profile, editId, onNavigate }) {
  const [form, setForm] = useState({ titre: '', description: '', prix: '', ville: '', categorie: '', contact: profile?.numero || '' })
  const [photoSlots, setPhotoSlots] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(!!editId)
  const [error, setError] = useState(null)
  const [limitReached, setLimitReached] = useState(false)
  const [checkingLimit, setCheckingLimit] = useState(!editId)

  useEffect(() => {
    async function loadExisting() {
      if (!editId) return
      const { data } = await supabase.from('annonces').select('*').eq('id', editId).single()
      if (data) {
        setForm({
          titre: data.titre, description: data.description || '', prix: String(data.prix),
          ville: data.ville, categorie: data.categorie, contact: data.contact || '',
        })
        const existingPhotos = data.photos && data.photos.length > 0 ? data.photos : (data.photo_url ? [data.photo_url] : [])
        setPhotoSlots(existingPhotos.map((url) => ({ file: null, preview: url, existingUrl: url })))
      }
      setLoadingExisting(false)
    }
    loadExisting()
  }, [editId])

  useEffect(() => {
    async function checkLimit() {
      if (editId || !user?.id) { setCheckingLimit(false); return }
      const { data: prof } = await supabase.from('profiles').select('verified').eq('id', user.id).single()
      if (prof?.verified) { setCheckingLimit(false); return }
      const { count } = await supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if ((count || 0) >= 3) setLimitReached(true)
      setCheckingLimit(false)
    }
    checkLimit()
  }, [editId, user])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleAddPhoto = (e) => {
    const files = Array.from(e.target.files || [])
    const remaining = MAX_PHOTOS - photoSlots.length
    const toAdd = files.slice(0, remaining).map((file) => ({ file, preview: URL.createObjectURL(file), existingUrl: null }))
    setPhotoSlots((prev) => [...prev, ...toAdd])
    e.target.value = ''
  }

  const handleRemovePhoto = (index) => {
    setPhotoSlots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.titre || !form.prix || !form.ville || !form.categorie || !form.contact) {
      setError('Titre, prix, ville, catégorie et contact sont obligatoires.')
      return
    }
    setSaving(true)

    const finalUrls = []
    for (const slot of photoSlots) {
      if (slot.existingUrl) {
        finalUrls.push(slot.existingUrl)
        continue
      }
      const fileExt = slot.file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('annonces-photos').upload(filePath, slot.file)
      if (uploadError) {
        setSaving(false)
        setError("Erreur lors de l'envoi d'une photo : " + uploadError.message)
        return
      }
      const { data: publicUrlData } = supabase.storage.from('annonces-photos').getPublicUrl(filePath)
      finalUrls.push(publicUrlData.publicUrl)
    }

    const payload = {
      titre: form.titre, description: form.description, prix: Number(form.prix),
      categorie: form.categorie, ville: form.ville, contact: form.contact,
      photos: finalUrls, photo_url: finalUrls[0] || null,
    }

    let submitError
    if (editId) {
      const { error: updateError } = await supabase.from('annonces').update(payload).eq('id', editId)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('annonces').insert({ ...payload, user_id: user.id })
      submitError = insertError
    }
    setSaving(false)
    if (submitError) {
      setError(submitError.message)
      return
    }
    onNavigate?.('my-listings')
  }

  if (loadingExisting || checkingLimit) {
    return <div style={{ padding: 24, fontFamily: FONT_BODY }}>Chargement...</div>
  }

  if (limitReached) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.brand}>Limite atteinte</div>
          <p style={styles.subtitle}>3 annonces maximum pour un compte non vérifié</p>
        </div>
        <div style={styles.limitBox}>
          <span style={{ fontSize: 34 }}>🔒</span>
          <p style={styles.limitText}>
            Tu as déjà publié 3 annonces. Vérifie ton compte pour publier sans limite et débloquer ta boutique perso.
          </p>
          <button style={styles.submitBtn} onClick={() => onNavigate?.('verification')}>
            Vérifier mon compte
          </button>
        </div>
        <BottomNav active="publish" onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>{editId ? "Modifier l'annonce" : 'Publier une annonce'}</div>
        <p style={styles.subtitle}>Produit ou service, en quelques infos.</p>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div>
          <span style={styles.label}>Photos ({photoSlots.length}/{MAX_PHOTOS})</span>
          <div style={styles.photoGrid}>
            {photoSlots.map((slot, i) => (
              <div key={i} style={styles.photoThumbWrapper}>
                <img src={slot.preview} alt={`Photo ${i + 1}`} style={styles.photoThumb} />
                <span style={styles.removePhotoBtn} onClick={() => handleRemovePhoto(i)}>✕</span>
                {i === 0 && <span style={styles.mainPhotoTag}>Principale</span>}
              </div>
            ))}
            {photoSlots.length < MAX_PHOTOS && (
              <label style={styles.addPhotoSlot}>
                <span style={styles.addPhotoIcon}>+</span>
                <input type="file" accept="image/*" multiple onChange={handleAddPhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        <Field label="Titre" value={form.titre} onChange={handleChange('titre')} placeholder="Ex: iPhone 11 64Go, bon état" />
        <Field label="Description" value={form.description} onChange={handleChange('description')} placeholder="Détaille ton produit ou service" textarea />
        <div style={styles.row}>
          <Field label="Prix (FCFA)" value={form.prix} onChange={handleChange('prix')} placeholder="15000" type="number" />
          <Field label="Ville" value={form.ville} onChange={handleChange('ville')} placeholder="Lomé" />
        </div>
        <Field label="Numéro de contact" value={form.contact} onChange={handleChange('contact')} placeholder="+228 90 00 00 00" type="tel" />

        <div>
          <span style={styles.label}>Catégorie</span>
          <div style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <div key={cat.key} onClick={() => setForm((prev) => ({ ...prev, categorie: cat.key }))}
                style={{ ...styles.chip, background: cat.color, color: cat.key === 'maison' ? COLORS.ink : '#fff', outline: form.categorie === cat.key ? `2px solid ${COLORS.ink}` : 'none', outlineOffset: 2 }}>
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={saving} style={styles.submitBtn}>
          {saving ? 'Enregistrement...' : editId ? 'Enregistrer les modifications' : "Publier l'annonce"}
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
      {textarea ? <textarea value={value} onChange={onChange} placeholder={placeholder} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} /> : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />}
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
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft, display: 'block', marginBottom: 8 },
  input: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  photoThumbWrapper: { position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%', objectFit: 'cover' },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: 'pointer' },
  mainPhotoTag: { position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6 },
  addPhotoSlot: { aspectRatio: '1', borderRadius: 12, border: `1.5px dashed ${COLORS.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  addPhotoIcon: { fontSize: 22, color: COLORS.muted, fontWeight: 300 },
  catRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  chip: { padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  error: { color: COLORS.terracotta, fontSize: 13, fontWeight: 600, margin: 0 },
  submitBtn: { marginTop: 6, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  limitBox: { background: COLORS.card, margin: '20px', borderRadius: 16, padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 14px rgba(43,37,96,0.08)' },
  limitText: { fontSize: 13, color: COLORS.muted, margin: '12px 0 18px', lineHeight: 1.5 },
}
