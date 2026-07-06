import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function OffreModal({ annonce, user, onClose, onSubmitted }) {
  const [montant, setMontant] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!montant || Number(montant) <= 0) {
      setError('Indique un montant valide.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('offres').insert({
      annonce_id: annonce.id,
      acheteur_id: user.id,
      montant_propose: Number(montant),
      message: message || null,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSent(true)
    onSubmitted?.()
    setTimeout(() => onClose?.(), 1200)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <p style={styles.sentText}>✅ Ton offre a été envoyée au vendeur !</p>
        ) : (
          <>
            <p style={styles.title}>Faire une offre</p>
            <p style={styles.originalPrice}>Prix affiché : {annonce.prix?.toLocaleString('fr-FR')} F CFA</p>
            <label style={styles.fieldWrapper}>
              <span style={styles.label}>Ton prix proposé (F CFA)</span>
              <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Ex: 12000" style={styles.input} />
            </label>
            <label style={styles.fieldWrapper}>
              <span style={styles.label}>Message (optionnel)</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pourquoi ce prix..." style={styles.textarea} />
            </label>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.actions}>
              <button style={styles.cancelBtn} onClick={onClose}>Annuler</button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Envoi...' : "Envoyer l'offre"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(33,30,27,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 },
  modal: { background: '#fff', width: '100%', borderRadius: '20px 20px 0 0', padding: '22px 20px 28px', fontFamily: FONT_BODY },
  title: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, margin: '0 0 4px', color: COLORS.ink },
  originalPrice: { fontSize: 12, color: COLORS.muted, margin: '0 0 16px' },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  input: { border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', fontFamily: FONT_BODY },
  textarea: { border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, fontSize: 13, fontFamily: FONT_BODY, resize: 'vertical', minHeight: 60, boxSizing: 'border-box' },
  error: { color: COLORS.terracotta, fontSize: 12, fontWeight: 600, marginBottom: 8 },
  actions: { display: 'flex', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  submitBtn: { flex: 1, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  sentText: { textAlign: 'center', fontSize: 14, fontWeight: 700, color: COLORS.teal, padding: '10px 0' },
}
