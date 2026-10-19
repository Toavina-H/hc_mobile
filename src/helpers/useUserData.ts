import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

// Data owned by the logged-in user, loaded once at login (or session restore) and kept in a provider
// so screens display it right away; `ready` turns true once the first load for this user settled
export function useUserData<T>(userId: string | undefined, fetcher: (userId: string) => Promise<T>, empty: T, errorMessage: string) {
  const emptyValue = useRef(empty).current
  const [data, setData] = useState<T>(emptyValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | undefined>()
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    if (!userId) {
      setData(emptyValue)
      setLoadedFor(undefined)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await fetcher(userId)
      if (id === requestId.current) setData(results)
    } catch (e) {
      if (id !== requestId.current) return
      console.warn(e)
      setError(errorMessage)
    } finally {
      if (id === requestId.current) {
        setLoading(false)
        setLoadedFor(userId)
      }
    }
  }, [userId, fetcher, emptyValue, errorMessage])

  // On login, logout and session restore
  useEffect(() => {
    refresh()
  }, [refresh])

  // Back from the background: things may have changed meanwhile
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh()
    })
    return () => subscription.remove()
  }, [refresh])

  return { data, setData, loading, error, refresh, ready: !userId || loadedFor === userId }
}
