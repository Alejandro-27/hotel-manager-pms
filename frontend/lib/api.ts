import type { Room, Guest, Reservation, Product, SaleItem, Sale, Invoice, Expense } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'recepcion'
  hotelName: string | null
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface DashboardReport {
  occupancyRate: number
  dailyRevenue: number
  pendingCheckins: Reservation[]
  lowStockProducts: Product[]
}

export interface FinancialReport {
  monthlyRevenue: { month: string; ingresos: number; gastos: number }[]
  totalRevenue: number
  totalPaid: number
}

export interface OccupancyReport {
  rate: number
  totalRooms: number
  occupiedRooms: number
  byType: { type: string; total: number; occupied: number }[]
  byStatus: { status: string; count: number }[]
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== 'all') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

const SESSION_EXPIRED_EVENT = 'session-expired'
const publicEndpoints = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/refresh'])

export function emitSessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }
}

export function onSessionExpired(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(SESSION_EXPIRED_EVENT, callback)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback)
}

async function doRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      json?.error ?? json?.message ?? `Error en la petición (${res.status})`
    throw new ApiError(res.status, message)
  }

  return json as T
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = api.auth
      .refresh()
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    return await doRequest<T>(endpoint, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !publicEndpoints.has(endpoint)) {
      const refreshed = await tryRefreshSession()
      if (refreshed) {
        return doRequest<T>(endpoint, options)
      }
      emitSessionExpired()
    }
    throw error
  }
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { name: string; email: string; password: string; hotelName?: string }) =>
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<AuthUser>('/api/auth/me'),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    refresh: () => doRequest<AuthResponse>('/api/auth/refresh', { method: 'POST' }),
    updateProfile: (data: { name?: string; hotelName?: string | null }) =>
      request<AuthUser>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ ok: boolean }>('/api/auth/password', { method: 'POST', body: JSON.stringify(data) }),
  },

  rooms: {
    get: (params?: { status?: string; type?: string; floor?: number }) =>
      request<Room[]>(`/api/rooms${buildQuery(params)}`),
    create: (data: Omit<Room, 'id' | 'status'>) =>
      request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Room>) =>
      request<Room>(`/api/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: Room['status']) =>
      request<Room>(`/api/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  guests: {
    get: (q?: string) => request<Guest[]>(`/api/guests${buildQuery({ q })}`),
    create: (data: { name: string; document: string; country: string; email: string; phone: string }) =>
      request<Guest>('/api/guests', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Guest, 'name' | 'document' | 'country' | 'email' | 'phone'>>) =>
      request<Guest>(`/api/guests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  reservations: {
    get: (params?: { status?: string; roomId?: string; guestId?: string }) =>
      request<Reservation[]>(`/api/reservations${buildQuery(params)}`),
    create: (data: {
      guestId: string
      roomId: string
      checkIn: string
      checkOut: string
      guests: number
      paymentMethod: Reservation['paymentMethod']
      advancePayment?: number
      notes?: string
    }) => request<Reservation>('/api/reservations', { method: 'POST', body: JSON.stringify(data) }),
    checkin: (id: string) => request<Reservation>(`/api/reservations/${id}/checkin`, { method: 'PATCH' }),
    checkout: (id: string) => request<Reservation>(`/api/reservations/${id}/checkout`, { method: 'PATCH' }),
    cancel: (id: string) => request<Reservation>(`/api/reservations/${id}/cancel`, { method: 'PATCH' }),
  },

  products: {
    get: (category?: string) => request<Product[]>(`/api/products${buildQuery({ category })}`),
    create: (data: {
      name: string
      category: Product['category']
      price: number
      currentStock?: number
      minStock?: number
      image?: string
    }) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    updateStock: (id: string, currentStock: number) =>
      request<Product>(`/api/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ currentStock }) }),
    update: (
      id: string,
      data: Partial<{
        name: string
        category: Product['category']
        price: number
        currentStock: number
        minStock: number
        image: string
      }>,
    ) => request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<null>(`/api/products/${id}`, { method: 'DELETE' }),
  },

  sales: {
    get: (date?: string) => request<Sale[]>(`/api/sales${buildQuery({ date })}`),
    create: (data: { items: SaleItem[]; paymentMethod: string; roomId?: string }) =>
      request<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  },

  invoices: {
    get: (params?: { status?: string; guestId?: string }) =>
      request<Invoice[]>(`/api/invoices${buildQuery(params)}`),
    pay: (id: string, data: { amount: number; paymentMethod?: Reservation['paymentMethod'] }) =>
      request<Invoice>(`/api/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  },

  expenses: {
    get: () => request<Expense[]>('/api/expenses'),
    create: (data: { category: Expense['category']; amount: number; date: string; note?: string }) =>
      request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request<Expense>(`/api/expenses/${id}`, { method: 'DELETE' }),
  },

  reports: {
    dashboard: () => request<DashboardReport>('/api/reports/dashboard'),
    financial: (months = 6) => request<FinancialReport>(`/api/reports/financial?months=${months}`),
    occupancy: () => request<OccupancyReport>('/api/reports/occupancy'),
  },
}