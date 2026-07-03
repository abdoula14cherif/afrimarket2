import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const RAISONS = ['Arnaque suspectée', 'Prix ou produit mensonger', 'Contenu inapproprié', 'Doublon / spam', 'Autre']

export default function SignalementModal({ annonce, user, onClose, onSubmitted }) {
  const [raison, setRaison] = useState('')
  const [details, setDetails] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!raison) {
      setError('Choisis une raison.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('signalements').insert({
      annonce_id: annonce.id,
      auteur_id: user.id,
      raison: details ? `${raison} — ${details}` : raison,
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
          <p style={styles.sentText}>✅ Merci, ton signalement a été envoyé.</p>
        ) : (
          <>
            <p style={styles.title}>Signaler "{annonce.titre}"</p>
            <div style={styles.reasons}>
              {RAISONS.map((r) => (
                <div key={r} onClick={() => setRaison(r)} style={{ ...styles.reasonChip, background: raison === r ? COLORS.terracotta : '#F1EDE4', color: raison === r ? '#fff' : COLORS.ink }}>
                  {r}
                </div>
              ))}
            </div>
            <textarea placeholder="Détails (optionnel)" value={details} onChange={(e) => setDetails(e.target.value)} style={styles.textarea} />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.actions}>
              <button style={styles.cancelBtn} onClick={onClose}>Annuler</button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>{saving ? 'Envoi...' : 'Signaler'}</button>
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
  title: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, margin: '0 0 14px', color: COLORS.ink },
  reasons: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  reasonChip: { padding: '8px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  textarea: { width: '100%', minHeight: 60, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, fontSize: 13, fontFamily: FONT_BODY, resize: 'vertical', boxSizing: 'border-box' },
  error: { color: COLORS.terracotta, fontSize: 12, fontWeight: 600, marginTop: 8 },
  actions: { display: 'flex', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, background: '#F1EDE4', color: COLORS.ink, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  submitBtn: { flex: 1, background: COLORS.terracotta, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  sentText: { textAlign: 'center', fontSize: 14, fontWeight: 700, color: COLORS.teal, padding: '10px 0' },
}
