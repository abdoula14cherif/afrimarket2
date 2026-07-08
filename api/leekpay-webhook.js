import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function verifySignature(rawBody, signature, publicKey) {
  const expected = crypto.createHmac('sha256', publicKey).update(rawBody).digest('hex')
  return expected === signature
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['x-leekpay-signature']
  const rawBody = JSON.stringify(req.body)

  if (!signature || !verifySignature(rawBody, signature, process.env.LEEKPAY_PUBLIC_KEY)) {
    return res.status(401).json({ error: 'Signature invalide' })
  }

  const { event, transaction } = req.body

  if (event !== 'payment.success' || !transaction) {
    return res.status(200).json({ received: true, ignored: true })
  }

  const [type, id] = (transaction.description || '').split(':')

  try {
    if (type === 'subscription' && id) {
      await supabaseAdmin.from('profiles').update({ subscription_active: true }).eq('id', id)
    }

    if (type === 'boost' && id) {
      const boostedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      await supabaseAdmin.from('annonces').update({ boosted_until: boostedUntil }).eq('id', id)
    }

    await supabaseAdmin.from('paiements').insert({
      transaction_id: String(transaction.id),
      montant: transaction.amount,
      devise: transaction.currency,
      type,
      reference_id: id,
      statut: transaction.status,
      customer_email: transaction.customer_email,
      customer_phone: transaction.customer_phone,
    })

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Erreur webhook LeekPay:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
