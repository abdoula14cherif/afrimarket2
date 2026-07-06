import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

export default function ContactsPage({ user, onNavigate }) {
  const [tab, setTab] = useState('recus')
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [messages, setMessages] = useState([])
  const [loadingChat, setLoadingChat] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    loadLogs()
  }, [user])

  useEffect(() => {
    if (tab !== 'support' || !user?.id) return
    loadMessages()

    const channel = supabase
      .channel(`support-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${user.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tab, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadLogs() {
    if (!user?.id) return
    const { data } = await supabase
      .from('contacts_log')
      .select('id, created_at, annonces(id, titre, prix, ville, photo_url)')
      .order('created_at', { ascending: false })
    setLogs((data || []).filter((l) => l.annonces))
    setLoadingLogs(false)
  }

  async function loadMessages() {
    setLoadingChat(true)
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoadingChat(false)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    const text = input.trim()
    setInput('')
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      sender: 'user',
      message: text,
    })
    setSending(false)
    if (!error) {
      setMessages((prev) => [...prev, { sender: 'user', message: text, created_at: new Date().toISOString() }])
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await uploadAndSendAudio(blob)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch (err) {
      alert("Impossible d'accéder au micro. Vérifie les permissions.")
    }
  }

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const uploadAndSendAudio = async (blob) => {
    setSending(true)
    const filePath = `${user.id}/${Date.now()}.webm`
    const { error: uploadError } = await supabase.storage.from('support-audio').upload(filePath, blob)
    if (uploadError) {
      setSending(false)
      alert("Erreur lors de l'envoi du vocal.")
      return
    }
    const { data: publicUrlData } = supabase.storage.from('support-audio').getPublicUrl(filePath)
    const { error } = await supabase.from('support_messages').insert({
      user_id: user.id,
      sender: 'user',
      message: '🎤 Message vocal',
      audio_url: publicUrlData.publicUrl,
    })
    setSending(false)
    if (!error) {
      setMessages((prev) => [...prev, { sender: 'user', message: '🎤 Message vocal', audio_url: publicUrlData.publicUrl, created_at: new Date().toISOString() }])
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brand}>Contacts</div>
      </div>

      <div style={styles.tabs}>
        <div onClick={() => setTab('recus')} style={{ ...styles.tab, background: tab === 'recus' ? COLORS.indigo : '#fff', color: tab === 'recus' ? '#fff' : COLORS.ink }}>
          Contacts reçus
        </div>
        <div onClick={() => setTab('support')} style={{ ...styles.tab, background: tab === 'support' ? COLORS.indigo : '#fff', color: tab === 'support' ? '#fff' : COLORS.ink }}>
          💬 Support
        </div>
      </div>

      {tab === 'recus' && (
        <>
          {loadingLogs && <p style={styles.emptyText}>Chargement...</p>}
          {!loadingLogs && logs.length === 0 && <p style={styles.emptyText}>Personne n'a encore contacté tes annonces — partage-les !</p>}
          <div style={styles.list}>
            {logs.map((log) => (
              <div key={log.id} style={styles.item}>
                <div style={styles.thumb}>
                  {log.annonces.photo_url ? <img src={log.annonces.photo_url} alt="" style={styles.thumbImg} /> : <span>🛍️</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.itemTitle}>{log.annonces.titre}</p>
                  <p style={styles.itemMeta}>{log.annonces.ville} · {new Date(log.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span style={styles.priceTag}>{log.annonces.prix?.toLocaleString('fr-FR')} F</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'support' && (
        <div style={styles.chatWrapper}>
          <div style={styles.chatIntro}>
            <p style={styles.chatIntroText}>Une question, un problème ? Écris-nous ou envoie un vocal, on te répond dès que possible.</p>
          </div>
          <div style={styles.chatMessages}>
            {loadingChat && <p style={styles.emptyText}>Chargement...</p>}
            {!loadingChat && messages.length === 0 && <p style={styles.emptyText}>Aucun message pour l'instant. Dis-nous ce qui ne va pas 👇</p>}
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.bubbleRow, justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...styles.bubble, background: m.sender === 'user' ? COLORS.marigold : '#fff', color: COLORS.ink }}>
                  {m.audio_url ? (
                    <audio controls src={m.audio_url} style={styles.audioPlayer} />
                  ) : (
                    m.message
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={styles.chatInputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écris ton message..."
              style={styles.chatInput}
              disabled={recording}
            />
            {!recording ? (
              <>
                <button style={styles.micBtn} onClick={handleStartRecording}>🎤</button>
                <button style={styles.sendBtn} onClick={handleSend} disabled={sending}>➤</button>
              </>
            ) : (
              <button style={styles.recordingBtn} onClick={handleStopRecording}>⏹ Envoyer le vocal</button>
            )}
          </div>
        </div>
      )}

      <BottomNav active="contacts" onNavigate={onNavigate} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90, display: 'flex', flexDirection: 'column' },
  header: { background: COLORS.indigo, padding: '28px 20px 20px', borderRadius: '0 0 28px 28px', color: '#fff' },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20 },
  tabs: { display: 'flex', gap: 8, padding: '16px 20px 0' },
  tab: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,37,96,0.08)' },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', padding: '30px 20px' },
  list: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  item: { display: 'flex', alignItems: 'center', gap: 12, background: COLORS.card, borderRadius: 14, padding: '10px 12px', boxShadow: '0 4px 14px rgba(43,37,96,0.06)' },
  thumb: { width: 46, height: 46, borderRadius: 10, background: COLORS.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemTitle: { fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.ink },
  itemMeta: { fontSize: 11, color: COLORS.muted, margin: '2px 0 0' },
  priceTag: { fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5, color: COLORS.indigo },
  chatWrapper: { display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 20px 0' },
  chatIntro: { background: COLORS.card, borderRadius: 12, padding: '10px 14px', marginBottom: 12 },
  chatIntroText: { fontSize: 12, color: COLORS.muted, margin: 0 },
  chatMessages: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200, paddingBottom: 10 },
  bubbleRow: { display: 'flex' },
  bubble: { maxWidth: '78%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  audioPlayer: { height: 34, maxWidth: 220 },
  chatInputRow: { display: 'flex', gap: 8, padding: '10px 0 16px' },
  chatInput: { flex: 1, background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '11px 16px', fontSize: 13, outline: 'none', fontFamily: FONT_BODY },
  micBtn: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: '50%', width: 42, height: 42, fontSize: 16, cursor: 'pointer' },
  sendBtn: { background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  recordingBtn: { flex: 1, background: COLORS.terracotta, color: '#fff', border: 'none', borderRadius: 20, padding: '11px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', animation: 'gp-pulse 1s ease-in-out infinite' },
}
