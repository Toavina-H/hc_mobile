// src/mocks/messages.ts
// TODO: replace with data fetched from the API
// Expected shape once wired up: { id, name, role, company, offerTitle, lastMessage, fromMe, time, unreadCount }

export type Conversation = {
  id: string
  name: string
  role: string
  company: string
  offerTitle: string
  lastMessage: string
  fromMe: boolean
  time: string
  unreadCount: number
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Claire Lefèvre',
    role: 'Expert-comptable associée',
    company: 'Cabinet Lefèvre Conseil',
    offerTitle: 'Collaborateur comptable H/F',
    lastMessage: 'Seriez-vous disponible jeudi à 14h pour un entretien en visio ?',
    fromMe: false,
    time: '09:42',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Julien Bertin',
    role: 'Maître de stage',
    company: 'Cabinet Bertin',
    offerTitle: 'Expert-comptable stagiaire H/F',
    lastMessage: "Parfait, je vous envoie l'adresse du cabinet par mail.",
    fromMe: false,
    time: 'Hier',
    unreadCount: 1,
  },
  {
    id: '3',
    name: 'Sophie Martin',
    role: 'Responsable RH',
    company: 'Axens Expertise',
    offerTitle: 'Gestionnaire de paie H/F',
    lastMessage: 'Merci pour votre retour, je reste disponible si besoin.',
    fromMe: true,
    time: 'Hier',
    unreadCount: 0,
  },
  {
    id: '4',
    name: 'Thomas Morel',
    role: 'Associé',
    company: 'Morel & Associés',
    offerTitle: 'Assistant comptable H/F',
    lastMessage: 'Bienvenue dans l’équipe ! Votre contrat vous a été envoyé.',
    fromMe: false,
    time: 'Lun.',
    unreadCount: 0,
  },
  {
    id: '5',
    name: 'Nadia Benali',
    role: 'Chargée de recrutement',
    company: 'Comptalis',
    offerTitle: 'Auditeur junior H/F',
    lastMessage: 'Votre candidature a bien été transmise au responsable du pôle audit.',
    fromMe: false,
    time: '08/09',
    unreadCount: 1,
  },
  {
    id: '6',
    name: 'Marc Dubois',
    role: 'Directeur de mission',
    company: 'Nexa Audit',
    offerTitle: 'Chef de mission expertise H/F',
    lastMessage: "D'accord, merci beaucoup pour votre réponse.",
    fromMe: true,
    time: '02/09',
    unreadCount: 0,
  },
]
