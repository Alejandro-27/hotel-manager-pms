import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, formatCurrency, exportToCsv, periodRangeLabel } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    const shouldHide = false
    const result = cn('base', shouldHide && 'hidden', 'extra')
    expect(result).toContain('base')
    expect(result).toContain('extra')
    expect(result).not.toContain('hidden')
  })
})

describe('formatCurrency', () => {
  it('formats COP currency by default', () => {
    const result = formatCurrency(1234567)
    expect(result).toContain('1.234.567')
    expect(result).toContain('$')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-50000)
    expect(result).toContain('50.000')
  })

  it('formats EUR when specified', () => {
    const result = formatCurrency(1234.56, 'EUR')
    expect(result).toContain('1234,56')
    expect(result).toContain('€')
  })
})

describe('exportToCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers a CSV download with headers and rows', () => {
    const createObjectURL = vi.fn<(obj: Blob) => string>(() => 'blob:csv')
    URL.createObjectURL = createObjectURL
    const click = vi.fn<() => void>()
    HTMLAnchorElement.prototype.click = click

    exportToCsv('informe.csv', [
      { Mes: 'Ene', Ingresos: 100, Gastos: 40 },
      { Mes: 'Feb', Ingresos: 200, Gastos: 80 },
    ])

    expect(click).toHaveBeenCalledTimes(1)
    const [blob] = createObjectURL.mock.calls[0]
    expect(blob.type).toBe('text/csv;charset=utf-8;')
  })

  it('escapes commas and quotes in values', () => {
    const createObjectURL = vi.fn<(obj: Blob) => string>(() => 'blob:csv')
    URL.createObjectURL = createObjectURL
    const click = vi.fn<() => void>()
    HTMLAnchorElement.prototype.click = click

    exportToCsv('informe.csv', [{ Concepto: 'Luz, agua & "extras"', Importe: '10,5' }])

    const [blob] = createObjectURL.mock.calls[0]
    const text = blob.text().then((t) => t)
    return expect(text).resolves.toContain('"Luz, agua & ""extras"""')
  })

  it('does nothing when there are no rows', () => {
    const createObjectURL = vi.fn<(obj: Blob) => string>()
    URL.createObjectURL = createObjectURL
    exportToCsv('informe.csv', [])
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('prepends metadata lines before the header row', () => {
    const createObjectURL = vi.fn<(obj: Blob) => string>(() => 'blob:csv')
    URL.createObjectURL = createObjectURL

    exportToCsv(
      'informe.csv',
      [{ Mes: 'Ene', Ingresos: 100 }],
      ['Hotel Test', 'Informe financiero', 'Periodo: 01 mar 2026 - 25 sep 2026'],
    )

    const [blob] = createObjectURL.mock.calls[0]
    return expect(blob.text()).resolves.toContain(
      'Hotel Test\nInforme financiero\nPeriodo: 01 mar 2026 - 25 sep 2026\n\nMes,Ingresos'
    )
  })
})

describe('periodRangeLabel', () => {
  it('builds the range from the first day of the first month to today', () => {
    const result = periodRangeLabel(6, new Date(2026, 8, 25))
    expect(result).toBe('01 abr 2026 - 25 sept 2026')
    expect(result).toContain(' - ')
  })

  it('uses the current month for a 1 month period', () => {
    const result = periodRangeLabel(1, new Date(2026, 8, 25))
    const start = result.split(' - ')[0]
    expect(start).toContain('2026')
  })
})
