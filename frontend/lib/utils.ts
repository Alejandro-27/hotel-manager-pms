import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyConfig: Record<string, { locale: string; currency: string }> = {
  COP: { locale: 'es-CO', currency: 'COP' },
  EUR: { locale: 'es-ES', currency: 'EUR' },
  USD: { locale: 'en-US', currency: 'USD' },
  MXN: { locale: 'es-MX', currency: 'MXN' },
}

export function formatCurrency(amount: number, code: string = 'COP'): string {
  const config = currencyConfig[code] ?? currencyConfig.COP
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: config.currency === 'COP' ? 0 : 2,
  }).format(amount)
}

export function periodRangeLabel(months: number, now: Date = new Date()): string {
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const fmt = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${fmt.format(from)} - ${fmt.format(now)}`
}

export function sanitizeDecimalInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const [whole, ...decimals] = normalized.split('.')
  if (decimals.length === 0) return whole
  return `${whole}.${decimals.join('').slice(0, 2)}`
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, '')
}

const BLOCKED_NUMBER_KEYS = new Set(['e', 'E', '+', '-'])

export function isBlockedNumberKey(key: string): boolean {
  return BLOCKED_NUMBER_KEYS.has(key)
}
