import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMessaging, onMessage } from '@react-native-firebase/messaging'
import stelace from '../api/stelace'
import { useAuth } from './Authentification'
import { buildInbox, getMyIds, InboxConversation, profileAssetIds } from '../helpers/inbox'
import { useUserData } from '../helpers/useUserData'

type InboxData = { messages: any[]; users: any[]; profileAssets: any[] }

type InboxContextValue = {
  conversations: InboxConversation[]
  // Every message of the user, scheduled ones included
  messages: any[]
  loading: boolean
  error: string | null
  ready: boolean
  unreadCount: number
  refresh: () => Promise<void>
  // Without an interlocutor, marks every conversation as read
  markAsRead: (interlocutorId?: string) => void
  addMessage: (message: any) => void
}

const EMPTY: InboxData = { messages: [], users: [], profileAssets: [] }

const InboxContext = createContext<InboxContextValue | undefined>(undefined)

// Shared by the Messages tab, its badge and the Conversation screen, loaded at login
export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const userId: string | undefined = currentUser?.id
  const myIdsKey = getMyIds(currentUser).join(',')
  const myIds = useMemo(() => (myIdsKey ? myIdsKey.split(',') : []), [myIdsKey])
  // Read locally, kept read even if a refetch lands before the PATCH did
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const fetchInbox = useCallback(
    async (id: string): Promise<InboxData> => {
      const messages = await stelace.messages.listAll({ userId: id })
      const participantIds: string[] = [...new Set<string>(messages.flatMap((m: any) => [m.senderId, m.receiverId]))]
      const users = await stelace.users.list(participantIds.filter(p => !myIds.includes(p)))
      // Applicants' avatars live on their profile asset; not worth failing the whole inbox for
      const assetIds = profileAssetIds(buildInbox(messages, users, myIds))
      const profileAssets = assetIds.length
        ? await stelace.assets.list(assetIds).catch((e: unknown) => {
            console.warn(e)
            return []
          })
        : []
      return { messages, users, profileAssets }
    },
    [myIds],
  )

  const { data, setData, loading, error, refresh, ready } = useUserData(
    userId,
    fetchInbox,
    EMPTY,
    'Impossible de charger vos messages.',
  )

  // A new message while the app is open
  useEffect(() => {
    if (!userId) return
    return onMessage(getMessaging(), message => {
      if (message.data?.type === 'new_message_received') refresh()
    })
  }, [userId, refresh])

  const messages = useMemo(
    () => data.messages.map(m => (!m.read && readIds.has(m.id) ? { ...m, read: true } : m)),
    [data.messages, readIds],
  )

  const conversations = useMemo(
    () =>
      buildInbox(messages, data.users, myIds).map(conv => {
        const profileAsset = data.profileAssets.find(a => a.ownerId === conv.interlocutorId)
        return profileAsset ? { ...conv, interlocutor: { ...conv.interlocutor, profileAsset } } : conv
      }),
    [messages, data.users, data.profileAssets, myIds],
  )

  // Updated in place rather than refetched; a failed PATCH is not worth bothering the user
  const markAsRead = useCallback(
    (interlocutorId?: string) => {
      const unread = messages.filter(
        m => !m.read && myIds.includes(m.receiverId) && (!interlocutorId || m.senderId === interlocutorId),
      )
      if (unread.length === 0) return
      setReadIds(prev => new Set([...prev, ...unread.map(m => m.id)]))
      unread.forEach(m => stelace.messages.markAsRead(m.id).catch(console.warn))
    },
    [messages, myIds],
  )

  const addMessage = useCallback(
    (message: any) => setData(prev => ({ ...prev, messages: [message, ...prev.messages] })),
    [setData],
  )

  const unreadCount = conversations.filter(c => c.nbUnread > 0).length

  return (
    <InboxContext.Provider
      value={{ conversations, messages, loading, error, ready, unreadCount, refresh, markAsRead, addMessage }}
    >
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox() {
  const ctx = useContext(InboxContext)
  if (!ctx) throw new Error('useInbox must be used within an InboxProvider')
  return ctx
}
