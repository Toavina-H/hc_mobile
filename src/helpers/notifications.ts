import stelace from '../api/stelace'
import { htmlToText } from './html'

export type NotificationKind = 'application' | 'interview' | 'offer' | 'profile' | 'other'

export type Notification = {
  id: string
  kind: NotificationKind
  title: string
  description: string
  createdDate: string
  read: boolean
  applicationId?: string
}

// API types (hc-api plugins/notification/util/common.js) an applicant can receive
const KIND_BY_TYPE: Record<string, NotificationKind> = {
  application_status_updated: 'application',
  offer_pushed: 'offer',
  saved_search_alert: 'offer',
  interview_reminder: 'interview',
  meeting_slot_proposed: 'interview',
  resume_expiring_soon: 'profile',
  resume_expired: 'profile',
  applicant_reminder: 'profile',
  applicant_welcome: 'profile',
  salary_comparator_sequence: 'profile',
}

// New messages already show up in the Messages tab, no need to list them twice
const HIDDEN_TYPES = ['new_message_received']

const INBOX_STATUSES = ['sent', 'delivered', 'opened', 'clicked']
const UNREAD_STATUSES = ['sent', 'delivered']

function toNotification(n: any): Notification {
  return {
    id: n.id,
    kind: KIND_BY_TYPE[n.type] ?? 'other',
    title: n.title ?? '',
    description: n.preview || htmlToText(n.body ?? ''),
    createdDate: n.createdDate,
    read: !UNREAD_STATUSES.includes(n.status),
    applicationId: n.relatedObjectsIds?.transactionId,
  }
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const results = await stelace.notifications.list({ status: INBOX_STATUSES })
  return results
    .filter((n: any) => n.receiverId === userId && !HIDDEN_TYPES.includes(n.type))
    .map(toNotification)
}

export function markNotificationAsRead(id: string) {
  return stelace.notifications.update(id, { status: 'opened' })
}

export function formatRelativeTime(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

export function formatDayLabel(iso: string) {
  const date = new Date(iso)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === new Date().toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
