import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, formatCurrency, exportToCsv } from './utils'

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
    const createObjectURL = vi.fn(() => 'blob:csv')
    URL.createObjectURL = createObjectURL
    const click = vi.fn()
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
    const createObjectURL = vi.fn(() => 'blob:csv')
    URL.createObjectURL = createObjectURL
    const click = vi.fn()
    HTMLAnchorElement.prototype.click = click

    exportToCsv('informe.csv', [{ Concepto: 'Luz, agua & "extras"', Importe: '10,5' }])

    const [blob] = createObjectURL.mock.calls[0]
    const text = blob.text().then((t) => t)
    return expect(text).resolves.toContain('"Luz, agua & ""extras"""')
  })

  it('does nothing when there are no rows', () => {
    const createObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    exportToCsv('informe.csv', [])
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
