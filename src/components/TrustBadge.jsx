import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { COLORS } from '../constants.js'

export default function TrustBadge({ userId, size = 'normal' }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase.rpc('get_trust_score', { p_user_id: userId }).then(({ data: result }) => {
      if (result?.[0]) setData(result[0])
    })
  }, [userId])

  if (!data) return null

  const small = size === 'small'

  return (
    <span style={{ ...styles.badge, fontSize: small ? 10.5 : 12, padding: small ? '3px 9px' : '4px 11px' }}>
      {data.label}
    </span>
  )
}

const styles = {
  badge: {
    display: 'inline-block',
    background: COLORS.indigo,
    color: '#fff',
    fontWeight: 700,
    borderRadius: 12,
  },
}
