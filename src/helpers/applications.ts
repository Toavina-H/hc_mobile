import stelace from '../api/stelace'
import { htmlToText } from './html'

export const APPLICATION_STATUSES = [
  { key: 'received', label: 'Reçue', values: ['new', 'custom', 'restricted'] },
  { key: 'pending', label: 'En cours', values: ['pending'] },
  { key: 'meeting', label: 'Entretien', values: ['meeting'] },
  { key: 'recruited', label: 'Embauché', values: ['recruited'] },
  { key: 'refused', label: 'Refusé', values: ['refused'] },
  { key: 'cancelled', label: 'Annulée', values: ['cancelled'] },
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]['key']

export type Offer = {
  id: string
  title: string
  company: string
  location: string | null
  contractType: string | null
  salary: string | null
  workMode: string | null
  publishedAt: string | null
  description: string
}

export type Application = {
  id: string
  status: ApplicationStatus
  appliedAt: string
  spontaneous: boolean
  offer: Offer
}

const REMOTE_WORK: Record<string, string> = {
  yes: 'Télétravail total possible',
  partial: 'Télétravail possible partiellement',
  temporary: 'Télétravail temporairement possible',
  no: 'Télétravail impossible',
  yes_1: 'Télétravail 1 jour par semaine',
  yes_2: 'Télétravail 2 jours par semaine',
  yes_3_more: 'Télétravail 3 jours par semaine voire plus',
}

// Contract categories that come with a duration (`needDuration` in @hc/ui/composables/useMisc.js)
const CATEGORIES_WITH_DURATION = [
  'ctgy_J9Ap2E1VZy1kszSVVZy',
  'ctgy_zC01TE1E821lhRR9E82',
  'ctgy_2X0J7E1yoK1lMDoxyoK',
  'ctgy_SOyXrE1YW11m1pRBYW1',
  'ctgy_HMYe0E1WG01ktfVPWG0',
]

const SALARY_PERIOD: Record<string, string> = { yearly: 'an', monthly: 'mois', weekly: 'semaine', daily: 'jour', hourly: 'heure' }
const SALARY_TAX: Record<string, string> = { gross: 'brut', net: 'net' }

export function applicationStatus(trnStatus: string): ApplicationStatus {
  return APPLICATION_STATUSES.find(s => (s.values as readonly string[]).includes(trnStatus))?.key ?? 'received'
}

export function formatDate(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatEur(amount: number) {
  if (amount >= 1000) return `${(amount / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k€`
  return `${amount.toLocaleString('fr-FR')} €`
}

function formatSalary(offer: any) {
  const job = offer.metadata?._job ?? {}
  const { salaryMin: min, salaryMax: max, salaryPeriod: period } = offer.customAttributes ?? {}
  if (job.salaryUndefined) return 'Salaire non renseigné'
  if (!job.salaryType || !period) return null

  const amount = {
    range: min != null && max != null ? `${formatEur(min)} - ${formatEur(max)}` : null,
    from: min != null ? `À partir de ${formatEur(min)}` : null,
    up_to: max != null ? `Jusqu'à ${formatEur(max)}` : null,
    exact: max != null ? formatEur(max) : null,
  }[job.salaryType as string]
  if (!amount) return null
  return [amount, SALARY_TAX[job.salaryTax]].filter(Boolean).join(' ') + ` / ${SALARY_PERIOD[period] ?? period}`
}

function formatLocation(offer: any) {
  const locations = offer.locations ?? []
  if (locations.length > 1) return `${locations.length} bureaux`
  return locations[0]?.city ?? null
}

function formatContractType(offer: any, categoriesById: Map<string, any>) {
  const name = categoriesById.get(offer.categoryId)?.name
  if (!name) return null
  if (!CATEGORIES_WITH_DURATION.includes(offer.categoryId)) return name
  return `${name} - ${offer.metadata?._job?.contractDuration ?? 'X'} mois`
}

function toApplication(trn: any, { companies, categoriesById, companyTypeId }: Context): Application {
  const asset = trn.assetSnapshot ?? {}
  const spontaneous = trn.assetTypeId === companyTypeId
  const company = companies.find(c => c.ownerId === trn.ownerId)
  const publishedAt =
    asset.platformData?.published ?? asset.platformData?._v1?.published ?? asset.platformData?._v1?.created ?? asset.createdDate

  return {
    id: trn.id,
    status: applicationStatus(trn.status),
    appliedAt: formatDate(trn.createdDate) ?? '',
    spontaneous,
    offer: {
      id: asset.id ?? trn.assetId,
      title: spontaneous ? 'Candidature spontanée' : asset.name ?? '',
      company: company?.name ?? (spontaneous ? asset.name : '') ?? '',
      location: formatLocation(spontaneous ? company ?? asset : asset),
      contractType: spontaneous ? null : formatContractType(asset, categoriesById),
      salary: spontaneous ? null : formatSalary(asset),
      workMode: spontaneous ? null : REMOTE_WORK[asset.customAttributes?.remoteWork] ?? null,
      publishedAt: spontaneous ? null : formatDate(publishedAt),
      description: htmlToText(asset.description ?? '', { keepLineBreaks: true }),
    },
  }
}

type Context = { companies: any[]; categoriesById: Map<string, any>; companyTypeId?: string }

async function assetTypeIds() {
  const config = await stelace.config.read()
  const ids = config?.custom?.assetTypeIds ?? {}
  return { offerTypeId: ids.offer as string | undefined, companyTypeId: ids.company as string | undefined }
}

async function buildContext(transactions: any[], companyTypeId?: string): Promise<Context> {
  const ownerIds = [...new Set<string>(transactions.map(t => t.ownerId).filter(Boolean))]
  const [companies, categories] = await Promise.all([
    companyTypeId ? stelace.assets.listBy({ ownerId: ownerIds, assetTypeId: [companyTypeId] }) : [],
    stelace.categories.list().catch((e: unknown) => {
      console.warn(e)
      return []
    }),
  ])
  return { companies, categoriesById: new Map(categories.map((c: any) => [c.id, c])), companyTypeId }
}

export async function fetchApplications(userId: string): Promise<Application[]> {
  const { offerTypeId, companyTypeId } = await assetTypeIds()
  const typeIds = [offerTypeId, companyTypeId].filter((id): id is string => !!id)
  const transactions = await stelace.transactions.list({ takerId: userId, assetTypeId: typeIds })
  const context = await buildContext(transactions, companyTypeId)
  return transactions.map((trn: any) => toApplication(trn, context))
}

// Resolves to null when the application doesn't exist
export async function fetchApplication(id: string): Promise<Application | null> {
  const [{ companyTypeId }, trn] = await Promise.all([assetTypeIds(), stelace.transactions.read(id)])
  if (!trn) return null
  return toApplication(trn, await buildContext([trn], companyTypeId))
}
