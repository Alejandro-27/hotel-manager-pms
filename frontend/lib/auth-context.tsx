"use client"

import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react"
import { api, onSessionExpired, type AuthUser } from "./api"
import type { LoginFormData, RegisterFormData } from "./validations"

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (data: LoginFormData) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
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
    const { user: u } = await api.auth.register({
      name: data.name,
      email: data.email,
      password: data.password,
      hotelName: data.hotelName,
    })
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // El logout local debe funcionar aunque la cookie haya expirado
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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