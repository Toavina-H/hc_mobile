// src/mocks/applications.ts
// TODO: replace with data fetched from the API

export type ApplicationStatus = 'Traitement' | 'Entretien' | 'Embauché' | 'Refusé'

export type Offer = {
  id: string
  title: string
  company: string
  location: string
  contractType: string
  salary: string
  workMode: string
  publishedAt: string
  description: string
  missions: string[]
  profile: string[]
}

export type Application = {
  id: string
  status: ApplicationStatus
  appliedAt: string
  offer: Offer
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    status: 'Entretien',
    appliedAt: '10 sept. 2026',
    offer: {
      id: 'o1',
      title: 'Collaborateur comptable H/F',
      company: 'Cabinet Lefèvre Conseil',
      location: 'Lyon (69)',
      contractType: 'CDI',
      salary: '32 000 - 38 000 € / an',
      workMode: 'Hybride (2 j. télétravail)',
      publishedAt: '2 sept. 2026',
      description:
        "Au sein d'une équipe de 12 personnes, vous gérez un portefeuille de TPE et PME variées (commerce, BTP, professions libérales) en lien direct avec l'expert-comptable associé.",
      missions: [
        'Tenue et révision des comptes',
        'Établissement des bilans et liasses fiscales',
        'Déclarations de TVA et fiscales courantes',
        'Relation client et conseil de premier niveau',
      ],
      profile: [
        'Formation DCG ou équivalent',
        "2 ans d'expérience minimum en cabinet",
        'Maîtrise de Cegid ou ACD appréciée',
      ],
    },
  },
  {
    id: '2',
    status: 'Traitement',
    appliedAt: '12 sept. 2026',
    offer: {
      id: 'o2',
      title: 'Gestionnaire de paie H/F',
      company: 'Axens Expertise',
      location: 'Paris 9e (75)',
      contractType: 'CDI',
      salary: '35 000 - 40 000 € / an',
      workMode: 'Sur site',
      publishedAt: '5 sept. 2026',
      description:
        'Rattaché(e) au pôle social, vous assurez la production de la paie et des déclarations sociales pour un portefeuille de clients de 5 à 150 salariés.',
      missions: [
        'Production des bulletins de paie',
        'DSN mensuelles et événementielles',
        'Gestion des entrées et sorties du personnel',
        'Veille sociale et conventionnelle',
      ],
      profile: [
        'Bac+2/3 en paie ou RH',
        'Première expérience réussie en cabinet',
        'Rigueur et sens de la confidentialité',
      ],
    },
  },
  {
    id: '3',
    status: 'Embauché',
    appliedAt: '18 août 2026',
    offer: {
      id: 'o3',
      title: 'Assistant comptable H/F',
      company: 'Morel & Associés',
      location: 'Bordeaux (33)',
      contractType: 'CDD - 6 mois',
      salary: '2 200 € brut / mois',
      workMode: 'Sur site',
      publishedAt: '1 août 2026',
      description:
        "Dans le cadre d'un surcroît d'activité, vous rejoignez l'équipe comptable pour accompagner les collaborateurs sur la période fiscale.",
      missions: [
        'Saisie des pièces comptables',
        'Rapprochements bancaires',
        'Préparation des dossiers de révision',
      ],
      profile: ['BTS CG ou DUT GEA', 'Aisance avec les outils informatiques'],
    },
  },
  {
    id: '4',
    status: 'Refusé',
    appliedAt: '25 août 2026',
    offer: {
      id: 'o4',
      title: 'Chef de mission expertise H/F',
      company: 'Nexa Audit',
      location: 'Nantes (44)',
      contractType: 'CDI',
      salary: '45 000 - 52 000 € / an',
      workMode: 'Hybride (1 j. télétravail)',
      publishedAt: '20 août 2026',
      description:
        "Vous encadrez une équipe de 3 collaborateurs et supervisez un portefeuille d'une soixantaine de dossiers, du suivi comptable à la présentation des comptes.",
      missions: [
        'Supervision et revue des dossiers',
        'Encadrement et formation des collaborateurs',
        'Présentation des comptes annuels aux clients',
        'Missions de conseil (prévisionnels, optimisation)',
      ],
      profile: [
        'DSCG ou mémorialiste DEC',
        '5 ans d’expérience en cabinet dont 2 en encadrement',
      ],
    },
  },
  {
    id: '5',
    status: 'Traitement',
    appliedAt: '13 sept. 2026',
    offer: {
      id: 'o5',
      title: 'Auditeur junior H/F',
      company: 'Comptalis',
      location: 'Lille (59)',
      contractType: 'CDI',
      salary: '36 000 € / an',
      workMode: 'Hybride (2 j. télétravail)',
      publishedAt: '8 sept. 2026',
      description:
        'Vous intervenez sur des missions de commissariat aux comptes et d’audit contractuel auprès de PME et d’associations.',
      missions: [
        'Contrôle des cycles comptables',
        'Rédaction des notes de synthèse',
        'Participation aux inventaires physiques',
      ],
      profile: [
        'Master CCA ou école de commerce',
        'Stage en audit apprécié',
        'Mobilité régionale',
      ],
    },
  },
  {
    id: '6',
    status: 'Entretien',
    appliedAt: '3 sept. 2026',
    offer: {
      id: 'o6',
      title: 'Expert-comptable stagiaire H/F',
      company: 'Cabinet Bertin',
      location: 'Marseille (13)',
      contractType: 'CDI',
      salary: '40 000 - 44 000 € / an',
      workMode: 'Sur site',
      publishedAt: '28 août 2026',
      description:
        "Vous préparez votre DEC au sein d'un cabinet à taille humaine, avec un accompagnement personnalisé par un maître de stage.",
      missions: [
        'Gestion autonome de dossiers',
        'Missions exceptionnelles (évaluation, transmission)',
        'Participation au développement du cabinet',
      ],
      profile: ['DSCG obtenu', 'Inscrit ou en cours d’inscription au stage DEC'],
    },
  },
]
