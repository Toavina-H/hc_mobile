// src/helpers/inbox.ts
// Port of the manager's messageStore.fetchInbox: groups raw Stelace messages into conversations

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
