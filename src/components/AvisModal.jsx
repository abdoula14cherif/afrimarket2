import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function AvisModal({ annonce, user, onClose, onSubmitted }) {
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (note === 0) {
      setError('Choisis une note de 1 à 5 étoiles.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('avis').insert({
      annonce_id: annonce.id,
      auteur_id: user.id,
      note,
      commentaire,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onSubmitted?.()
    onClose?.()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p style={styles.title}>Noter "{annonce.titre}"</p>
        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} onClick={() => setNote(n)} style={{ ...styles.star, color: n <= note ? COLORS.marigold : '#DDD' }}>★</span>
          ))}
        </div>
        <textarea placeholder="Ton commentaire (optionnel)" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={styles.textarea} />
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Annuler</button>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Envoi...' : 'Envoyer'}</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(33,30,27,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  modal: { background: '#fff', width: '100%', borderRadius: '20px 20px 0 0', padding: '22px 20px 28px', fontFamily: FONT_BODY },
  title: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, margin: '0 0 14px', color: COLORS.ink },
  stars: { display: 'flex', gap: 8, fontSize: 32, marginBottom: 14, cursor: 'pointer' },
  star: { cursor: 'pointer' },
  textarea: { width: '100%', minHeight: 70, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, fontSize: 13, fontFamily: FONT_BODY, resize: 'vertical', boxSizing: 'border-box' },
  error: { color: COLORS.terracotta, fontSize: 12, fontWeight: 600, marginTop: 8 },
  actions: { display: 'flex', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  submitBtn: { flex: 1, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
