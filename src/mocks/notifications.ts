// src/mocks/notifications.ts
// TODO: replace with data fetched from the API
// Expected shape once wired up: { id, type, title, description, time, date, read, applicationId? }

export type NotificationType = 'application' | 'interview' | 'message' | 'offer' | 'profile'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  date: string
  read: boolean
  // links to MOCK_APPLICATIONS so the notification can open the offer
  applicationId?: string
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'interview',
    title: 'Entretien proposé',
    description: 'Cabinet Lefèvre Conseil vous propose un entretien pour le poste de Collaborateur comptable.',
    time: 'Il y a 9 min',
    date: "Aujourd'hui",
    read: false,
    applicationId: '1',
  },
  {
    id: '2',
    type: 'message',
    title: 'Nouveau message de Claire Lefèvre',
    description: 'Seriez-vous disponible jeudi à 14h pour un entretien en visio ?',
    time: 'Il y a 12 min',
    date: "Aujourd'hui",
    read: false,
  },
  {
    id: '3',
    type: 'offer',
    title: 'Nouvelle offre pour vous',
    description: 'Un poste de Comptable fournisseurs à Lyon correspond à votre profil.',
    time: 'Il y a 1 j',
    date: 'Hier',
    read: false,
  },
  {
    id: '4',
    type: 'application',
    title: 'Candidature envoyée',
    description: 'Votre candidature pour le poste d’Auditeur junior chez Comptalis a bien été transmise.',
    time: 'Il y a 1 j',
    date: 'Hier',
    read: true,
    applicationId: '5',
  },
  {
    id: '5',
    type: 'profile',
    title: 'Complétez votre profil',
    description: 'Ajoutez les logiciels que vous maîtrisez pour recevoir des offres plus pertinentes.',
    time: 'Il y a 7 j',
    date: 'Lundi 7 septembre 2026',
    read: false,
  },
  {
    id: '6',
    type: 'application',
    title: 'Candidature retenue',
    description: 'Morel & Associés a retenu votre candidature pour le poste d’Assistant comptable.',
    time: 'Il y a 7 j',
    date: 'Lundi 7 septembre 2026',
    read: true,
    applicationId: '3',
  },
  {
    id: '7',
    type: 'application',
    title: 'Candidature non retenue',
    description: 'Nexa Audit n’a pas donné suite pour le poste de Chef de mission expertise.',
    time: 'Il y a 7 j',
    date: 'Lundi 7 septembre 2026',
    read: true,
    applicationId: '4',
  },
]
