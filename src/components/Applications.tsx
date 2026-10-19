import React, { createContext, useContext } from 'react'
import { useAuth } from './Authentification'
import { Application, fetchApplications } from '../helpers/applications'
import { useUserData } from '../helpers/useUserData'

type ApplicationsContextValue = {
  applications: Application[]
  loading: boolean
  error: string | null
  ready: boolean
  refresh: () => Promise<void>
}

const ApplicationsContext = createContext<ApplicationsContextValue | undefined>(undefined)

// Loaded at login so the Applications tab shows up filled
export function ApplicationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const { data, loading, error, refresh, ready } = useUserData(
    currentUser?.id,
    fetchApplications,
    [],
    'Impossible de charger vos candidatures.',
  )

  return (
    <ApplicationsContext.Provider value={{ applications: data, loading, error, ready, refresh }}>
      {children}
    </ApplicationsContext.Provider>
  )
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext)
  if (!ctx) throw new Error('useApplications must be used within an ApplicationsProvider')
  return ctx
}
