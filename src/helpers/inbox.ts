// src/helpers/inbox.ts
// Port of the manager's messageStore.fetchInbox: groups raw Stelace messages into conversations
import { cdnImg } from '../api/aws'

export type InboxConversation = {
  convId: string
  topicId: string | null
  interlocutorId: string
  interlocutor?: any
  // Newest first, scheduled messages excluded
  messages: any[]
  scheduledToSend: any[]
  nbUnread: number
}

const byNewest = (a: any, b: any) => (a.createdDate < b.createdDate ? 1 : a.createdDate > b.createdDate ? -1 : 0)

export function buildInbox(rawMessages: any[], users: any[], myIds: string[]): InboxConversation[] {
  const messages = [...rawMessages].sort(byNewest)
  const timeSortedConversationsIds = [...new Set(messages.map(m => m.conversationId))]

  const conversations: InboxConversation[] = []
  for (const convId of timeSortedConversationsIds) {
    const convMessages = messages.filter(m => m.conversationId === convId)
    const visible = convMessages.filter(m => !m.metadata?.scheduledToSend)
    const firstMessage = visible[0]
    if (!firstMessage) continue

    const interlocutorId = myIds.includes(firstMessage.senderId) ? firstMessage.receiverId : firstMessage.senderId
    const conv: InboxConversation = {
      convId,
      topicId: firstMessage.topicId ?? null,
      interlocutorId,
      interlocutor: users.find(u => u.id === interlocutorId),
      messages: visible,
      scheduledToSend: convMessages.filter(m => m.metadata?.scheduledToSend),
      nbUnread: visible.filter(m => myIds.includes(m.receiverId) && !m.read).length,
    }

    // Messages with the same interlocutor don't always share a conversationId: merge them
    const sameInterlocutorConv = conversations.find(c => c.interlocutorId === interlocutorId)
    if (sameInterlocutorConv) {
      sameInterlocutorConv.messages = [...sameInterlocutorConv.messages, ...conv.messages].sort(byNewest)
      sameInterlocutorConv.scheduledToSend = [...sameInterlocutorConv.scheduledToSend, ...conv.scheduledToSend].sort(byNewest)
      sameInterlocutorConv.nbUnread += conv.nbUnread
    } else {
      conversations.push(conv)
    }
  }

  return conversations
}

// Ids the current user sends/receives messages as: themselves plus their organizations
export function getMyIds(user: any): string[] {
  return user?.id ? [user.id, ...Object.keys(user.organizations ?? {})] : []
}

export function interlocutorName(interlocutor: any) {
  if (!interlocutor) return ''
  const fullName = [interlocutor.firstname, interlocutor.lastname].filter(Boolean).join(' ')
  return interlocutor.displayName || fullName
}

const AVATAR_PATHS = [
  ['profileAsset', 'metadata', '_resume', 'avatar'],
  ['metadata', '_resume', 'avatar'],
  ['metadata', '_files', 'avatar'],
  ['metadata', '_files', 'logo'],
  ['company', 'metadata', '_files', 'logo'],
  ['avatar'],
]

export function avatarUrl(entity: any, size = 96): string | null {
  if (!entity) return null
  for (const path of AVATAR_PATHS) {
    const key = path.reduce((obj, prop) => obj?.[prop], entity)
    if (typeof key !== 'string' || !key) continue
    if (/^(https?:)?\/\//i.test(key) || /^data:/i.test(key)) return key
    return cdnImg(key, { width: size, height: size })
  }
  return null
}

export function profileAssetIds(conversations: InboxConversation[]): string[] {
  const ids = conversations
    .filter(c => c.interlocutor?.roles?.includes('applicant'))
    .map(c => c.interlocutor?.metadata?._resume?.profileAssetId)
    .filter(Boolean)
  return [...new Set<string>(ids)]
}
