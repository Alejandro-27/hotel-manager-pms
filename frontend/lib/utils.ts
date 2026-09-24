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

function csvEscape(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function exportToCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(String(row[h]))).join(',')),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
