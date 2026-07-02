import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function VerificationPage({ user, onNavigate }) {
  const [status, setStatus] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStatus() {
      if (!user?.id) return
      const { data } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setStatus(data?.status || null)
      setLoading(false)
    }
    loadStatus()
  }, [user])

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Ajoute une photo de ta pièce d'identité.")
      return
    }
    setSaving(true)
    setError(null)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('verification-docs').upload(filePath, file)
    if (uploadError) {
      setSaving(false)
      setError("Erreur d'envoi : " + uploadError.message)
      return
    }
    const { error: insertError } = await supabase.from('verification_requests').insert({ user_id: user.id, document_url: filePath })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setStatus('pending')
  }

  if (loading) return <div style={{ padding: 24, fontFamily: FONT_BODY }}>Chargement...</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Vérification du compte</div>
        <p style={styles.subtitle}>Débloque la publication illimitée et ta boutique perso</p>
      </div>

      <div style={styles.content}>
        {status === 'approved' && <StatusCard icon="✅" color={COLORS.teal} title="Compte vérifié" text="Tu peux publier autant d'annonces que tu veux et créer ta boutique perso." />}
        {status === 'pending' && <StatusCard icon="⏳" color={COLORS.marigold} title="Demande en cours" text="Ta pièce d'identité est en cours de vérification. Ça prend généralement 24 à 48h." />}
        {status === 'rejected' && (
          <>
            <StatusCard icon="❌" color={COLORS.terracotta} title="Demande refusée" text="La photo n'était pas assez claire ou lisible. Réessaie avec une nouvelle photo." />
            <UploadForm file={file} preview={preview} error={error} saving={saving} onFileChange={handleFileChange} onSubmit={handleSubmit} />
          </>
        )}
        {status === null && (
          <>
            <div style={styles.benefits}>
              <Benefit icon="📢" text="Publie plus de 3 annonces" />
              <Benefit icon="🏪" text="Crée ta boutique perso avec ton lien" />
              <Benefit icon="✅" text="Badge vérifié visible par les acheteurs" />
            </div>
            <UploadForm file={file} preview={preview} error={error} saving={saving} onFileChange={handleFileChange} onSubmit={handleSubmit} />
          </>
        )}
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function StatusCard({ icon, color, title, text }) {
  return (
    <div style={styles.statusCard}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <p style={{ ...styles.statusTitle, color }}>{title}</p>
      <p style={styles.statusText}>{text}</p>
    </div>
  )
}

function Benefit({ icon, text }) {
  return (
    <div style={styles.benefitRow}>
      <span>{icon}</span>
      <span style={styles.benefitText}>{text}</span>
    </div>
  )
}

function UploadForm({ file, preview, error, saving, onFileChange, onSubmit }) {
  return (
    <div style={styles.uploadBlock}>
      <span style={styles.label}>Pièce d'identité (CNI, passeport)</span>
      <label style={styles.photoDrop}>
        {preview ? <img src={preview} alt="Aperçu" style={styles.photoPreview} /> : <span style={styles.photoPlaceholder}>📄 Ajouter une photo</span>}
        <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
      </label>
      {error && <p style={styles.error}>{error}</p>}
      <button style={styles.submitBtn} onClick={onSubmit} disabled={saving}>{saving ? 'Envoi...' : 'Envoyer pour vérification'}</button>
      <p style={styles.privacyNote}>Ta pièce d'identité n'est visible que par toi et l'équipe GainPay.</p>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '28px 20px 32px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  subtitle: { fontSize: 13, color: '#E4E1F2', marginTop: 6 },
  content: { padding: '20px' },
  benefits: { background: COLORS.card, borderRadius: 14, padding: '16px', marginBottom: 18, boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  benefitRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: COLORS.ink },
  benefitText: { fontWeight: 600 },
  statusCard: { background: COLORS.card, borderRadius: 14, padding: '22px 16px', textAlign: 'center', marginBottom: 18, boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  statusTitle: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, margin: '8px 0 4px' },
  statusText: { fontSize: 12.5, color: COLORS.muted, margin: 0 },
  uploadBlock: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.indigoSoft },
  photoDrop: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1.5px dashed ${COLORS.border}`, borderRadius: 14, height: 140, cursor: 'pointer', overflow: 'hidden' },
  photoPlaceholder: { fontSize: 13, color: COLORS.muted, fontWeight: 600 },
  photoPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  error: { color: COLORS.terracotta, fontSize: 12, fontWeight: 600, margin: 0 },
  submitBtn: { background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  privacyNote: { fontSize: 11, color: COLORS.muted, textAlign: 'center', margin: '4px 0 0' },
}
