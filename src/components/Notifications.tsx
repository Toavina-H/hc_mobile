import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { useAuth } from './Authentification'
import { fetchNotifications, markNotificationAsRead, Notification } from '../helpers/notifications'

type NotificationsContextValue = {
  notifications: Notification[]
  loading: boolean
  error: string | null
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    if (!userId) {
      setNotifications([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await fetchNotifications(userId)
      if (id === requestId.current) setNotifications(results)
    } catch (e) {
      if (id !== requestId.current) return
      console.warn(e)
      setError('Impossible de charger vos notifications.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [userId])

  // On login, logout and session restore
  useEffect(() => {
    refresh()
  }, [refresh])

  // Back from the background: notifications may have arrived meanwhile
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh()
    })
    return () => subscription.remove()
  }, [refresh])

  // Updated in place rather than refetched; a failed PATCH is not worth bothering the user
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    markNotificationAsRead(id).catch(console.warn)
  }, [])

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    unreadIds.forEach(id => markNotificationAsRead(id).catch(console.warn))
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{ notifications, loading, error, unreadCount, refresh, markAsRead, markAllAsRead }}
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
