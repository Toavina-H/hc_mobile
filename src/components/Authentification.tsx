import React, { createContext, useContext, useEffect, useState } from 'react'
import stelace from '../api/stelace'

type AuthContextValue = {
  currentUser: any | null
  loading: boolean
  refreshUser: (userId?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async (userId?: string) => {
    const user = await stelace.users.getCurrent(userId)
    setCurrentUser(user)
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}