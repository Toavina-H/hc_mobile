import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { getMessaging, onMessage } from '@react-native-firebase/messaging'
import { useAuth } from './Authentification'
import { fetchNotifications, markNotificationAsRead, Notification } from '../helpers/notifications'
import { displayForegroundPush } from '../helpers/pushNotifications'
import { useUserData } from '../helpers/useUserData'

type NotificationsContextValue = {
  notifications: Notification[]
  loading: boolean
  error: string | null
  ready: boolean
  unreadCount: number
  refresh: () => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

// Shared so the tab badge stays right even before the Notifications screen is opened
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const userId: string | undefined = currentUser?.id
  const {
    data: notifications,
    setData: setNotifications,
    loading,
    error,
    refresh,
    ready,
  } = useUserData(userId, fetchNotifications, [], 'Impossible de charger vos notifications.')

  // Push received while the app is open; message pushes belong to the Messages tab
  useEffect(() => {
    if (!userId) return
    return onMessage(getMessaging(), message => {
      displayForegroundPush(message).catch(console.warn)
      if (message.data?.type !== 'new_message_received') refresh()
    })
  }, [userId, refresh])

  // Updated in place rather than refetched; a failed PATCH is not worth bothering the user
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    markNotificationAsRead(id).catch(console.warn)
  }, [setNotifications])

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    unreadIds.forEach(id => markNotificationAsRead(id).catch(console.warn))
  }, [notifications, setNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{ notifications, loading, error, ready, unreadCount, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
