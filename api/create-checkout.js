export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, id, amount, description, customerEmail, customerPhone } = req.body

  if (!type || !id || !amount) {
    return res.status(400).json({ error: 'Parametres manquants' })
  }

  const origin = req.headers.origin || `https://${req.headers.host}`

  try {
    const response = await fetch('https://leekpay.fr/api/v1/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LEEKPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'XOF',
        description: description || 'Paiement GainPay',
        return_url: `${origin}/?payment=success`,
        cancel_url: `${origin}/?payment=cancel`,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        metadata: { type, id },
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return res.status(400).json({ error: data.message || 'Erreur creation paiement' })
    }

    return res.status(200).json({ payment_url: data.data.payment_url })
  } catch (err) {
    console.error('Erreur create-checkout:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
