export function buildWhatsAppLink(item, annonceId) {
  const digits = (item.contact || '').replace(/[^\d]/g, '')
  const id = annonceId || item.id
  const link = `${window.location.origin}?annonce=${id}`
  const prix = item.prix ? item.prix.toLocaleString('fr-FR') + ' F CFA' : ''

  const message = `Bonjour 👋 Je suis intéressé(e) par votre annonce sur GainPay :

📦 ${item.titre}
💰 ${prix}

Est-elle toujours disponible ?

🔗 ${link}`

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
