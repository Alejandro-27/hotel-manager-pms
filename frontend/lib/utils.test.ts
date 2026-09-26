import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, periodRangeLabel } from './utils'
import { buildReportSheetRows, reportFileName } from './export-report'

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

describe('buildReportSheetRows', () => {
  const rows = buildReportSheetRows(
    { hotelName: 'Hotel Test', periodLabel: '01 abr 2026 - 25 sept 2026', generatedAt: '25 sept 2026' },
    [
      { month: 'Abr', ingresos: 1000, gastos: 400 },
      { month: 'May', ingresos: 2000, gastos: 600 },
    ],
  )

  it('includes the hotel header block before the empty row', () => {
    const hotel = rows[0][0] as { value: string; columnSpan?: number }
    expect(hotel.value).toBe('Hotel Test')
    expect(hotel.columnSpan).toBe(4)
    expect(rows[1][0]).toMatchObject({ value: 'Informe financiero' })
    expect(rows[2][0]).toMatchObject({ value: 'Periodo: 01 abr 2026 - 25 sept 2026' })
    expect(rows[3][0]).toMatchObject({ value: 'Generado: 25 sept 2026' })
    expect(rows[4]).toEqual([])
  })

  it('writes column headers with a filled background', () => {
    const headers = rows[5].map((c) => c as { value: string; fontWeight?: string; backgroundColor?: string })
    expect(headers.map((h) => h.value)).toEqual(['Mes', 'Ingresos', 'Gastos', 'Beneficio'])
    for (const h of headers) {
      expect(h.fontWeight).toBe('bold')
      expect(h.backgroundColor).toBeTruthy()
    }
  })

  it('writes numeric cells as Excel numbers with a currency format', () => {
    const data = rows[6].map((c) => c as { value: number; type: unknown; format?: string; align?: string })
    expect(data[0].value).toBe('Abr')
    expect(data[1]).toMatchObject({ value: 1000, format: '$#,##0', align: 'right' })
    expect(data[2].value).toBe(400)
    expect(data[3].value).toBe(600)
    expect(data[1].type).toBe(Number)
  })

  it('appends a totals row with the sums', () => {
    const totals = rows[rows.length - 1].map((c) => c as { value: string | number; fontWeight?: string })
    expect(totals[0].value).toBe('Total')
    expect(totals[1].value).toBe(3000)
    expect(totals[2].value).toBe(1000)
    expect(totals[3].value).toBe(2000)
    expect(totals[0].fontWeight).toBe('bold')
  })
})

describe('reportFileName', () => {
  it('builds a dated xlsx filename', () => {
    expect(reportFileName(new Date(2026, 8, 25))).toBe('informe-financiero-2026-09-25.xlsx')
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
