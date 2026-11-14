"use client"

import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react"
import { api, onSessionExpired, type AuthUser } from "./api"
import type { LoginFormData, RegisterFormData } from "./validations"

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isPending: boolean
  login: (data: LoginFormData) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const initAuth = async () => {
      try {
        const userData = await api.auth.me()
        if (!cancelled) setUser(userData)
      } catch {
        try {
          const refreshed = await api.auth.refresh()
          if (refreshed && !cancelled) {
            const userData = await api.auth.me()
            if (!cancelled) setUser(userData)
          } else if (!cancelled) {
            setUser(null)
          }
        } catch {
          if (!cancelled) setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    initAuth()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const off = onSessionExpired(() => setUser(null))
    return off
  }, [])

  const login = useCallback(async (data: LoginFormData) => {
    const { user: u } = await api.auth.login(data)
    setUser(u)
  }, [])

  const register = useCallback(async (data: RegisterFormData) => {
    await api.auth.register({
      name: data.name,
      email: data.email,
      password: data.password,
      acceptTerms: data.acceptTerms,
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // El logout local debe funcionar aunque la cookie haya expirada
    }
    setUser(null)
    if (typeof window !== 'undefined') {
      window.location.pathname = '/'
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const u = await api.auth.me()
    setUser(u)
  }, [])

  const isPending = !!user && user.status !== 'activo'

  return (
    <AuthContext.Provider value={{ user, isLoading, isPending, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return ctx
}
