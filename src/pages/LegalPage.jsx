import { useState } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../constants.js'

const TABS = [
  { key: 'cgu', label: 'CGU' },
  { key: 'confidentialite', label: 'Confidentialité' },
  { key: 'apropos', label: 'À propos' },
]

export default function LegalPage({ onNavigate }) {
  const [active, setActive] = useState('cgu')

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.backBtn} onClick={() => onNavigate?.('profile')}>← Retour</span>
        <div style={styles.brand}>Informations légales</div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <div key={t.key} onClick={() => setActive(t.key)} style={{ ...styles.tab, background: active === t.key ? COLORS.indigo : '#fff', color: active === t.key ? '#fff' : COLORS.ink }}>
            {t.label}
          </div>
        ))}
      </div>

      <div style={styles.content}>
        {active === 'cgu' && <CGUContent />}
        {active === 'confidentialite' && <ConfidentialiteContent />}
        {active === 'apropos' && <AproposContent />}
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

function CGUContent() {
  return (
    <>
      <h2 style={styles.h2}>Conditions générales d'utilisation</h2>
      <p style={styles.p}>Dernière mise à jour : juillet 2026</p>
      <h3 style={styles.h3}>1. Objet</h3>
      <p style={styles.p}>GainPay est une plateforme de mise en relation entre particuliers et professionnels souhaitant vendre ou acheter des produits et services. GainPay ne participe à aucune transaction : les échanges (paiement, livraison) se font directement entre l'acheteur et le vendeur, en dehors de l'application.</p>
      <h3 style={styles.h3}>2. Inscription</h3>
      <p style={styles.p}>L'utilisation de GainPay nécessite la création d'un compte avec des informations exactes (nom, numéro de téléphone valide). L'utilisateur est responsable de la confidentialité de ses identifiants.</p>
      <h3 style={styles.h3}>3. Publication d'annonces</h3>
      <p style={styles.p}>Les utilisateurs non vérifiés peuvent publier jusqu'à 3 annonces. La vérification d'identité permet de publier sans limite. Toute annonce trompeuse, illégale ou frauduleuse peut être supprimée sans préavis.</p>
      <h3 style={styles.h3}>4. Responsabilité</h3>
      <p style={styles.p}>GainPay agit uniquement comme intermédiaire de mise en relation. GainPay n'est pas responsable de la qualité des produits/services, des transactions financières, ni des litiges entre utilisateurs. En cas de comportement frauduleux, utilisez la fonction "Signaler".</p>
      <h3 style={styles.h3}>5. Compte et suspension</h3>
      <p style={styles.p}>GainPay se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect de ces conditions ou de signalements répétés justifiés.</p>
    </>
  )
}

function ConfidentialiteContent() {
  return (
    <>
      <h2 style={styles.h2}>Politique de confidentialité</h2>
      <p style={styles.p}>Dernière mise à jour : juillet 2026</p>
      <h3 style={styles.h3}>Données collectées</h3>
      <p style={styles.p}>Nom, prénom, email, numéro de téléphone, et le cas échéant une pièce d'identité (pour la vérification de compte uniquement).</p>
      <h3 style={styles.h3}>Utilisation des données</h3>
      <p style={styles.p}>Vos informations servent uniquement au fonctionnement de la plateforme : affichage de votre profil vendeur, mise en relation avec les acheteurs, vérification d'identité. Votre numéro de téléphone est visible par les acheteurs intéressés par vos annonces, c'est nécessaire au principe de la plateforme.</p>
      <h3 style={styles.h3}>Pièce d'identité</h3>
      <p style={styles.p}>Les documents d'identité envoyés pour la vérification sont stockés de façon privée et ne sont accessibles qu'à vous-même et à l'équipe GainPay chargée de la validation. Ils ne sont jamais partagés publiquement.</p>
      <h3 style={styles.h3}>Vos droits</h3>
      <p style={styles.p}>Vous pouvez à tout moment modifier vos informations depuis votre profil, ou demander la suppression de votre compte en nous contactant.</p>
    </>
  )
}

function AproposContent() {
  return (
    <>
      <h2 style={styles.h2}>À propos de GainPay</h2>
      <p style={styles.p}>GainPay est une marketplace pensée pour l'Afrique : publier un produit ou un service, trouver des clients, et se mettre en relation directement par WhatsApp — sans complexité inutile.</p>
      <p style={styles.p}>Le projet démarre au Togo, avec l'ambition de s'étendre à d'autres pays d'Afrique francophone.</p>
      <h3 style={styles.h3}>Contact</h3>
      <p style={styles.p}>Une question, un problème, un signalement urgent ? Écris-nous depuis ton profil ou contacte l'équipe directement.</p>
    </>
  )
}

const styles = {
  page: { minHeight: '100vh', background: COLORS.sand, fontFamily: FONT_BODY, paddingBottom: 90 },
  header: { background: COLORS.indigo, padding: '20px 20px 24px', borderRadius: '0 0 28px 28px', color: '#fff' },
  backBtn: { fontSize: 12, fontWeight: 700, color: '#E4E1F2', cursor: 'pointer', display: 'block', marginBottom: 10 },
  brand: { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19 },
  tabs: { display: 'flex', gap: 8, padding: '16px 20px 0' },
  tab: { flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(43,37,96,0.08)' },
  content: { padding: '18px 20px 10px' },
  h2: { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' },
  h3: { fontFamily: FONT_DISPLAY, fontSize: 13.5, fontWeight: 700, color: COLORS.indigo, margin: '16px 0 4px' },
  p: { fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6, margin: '0 0 4px' },
}
