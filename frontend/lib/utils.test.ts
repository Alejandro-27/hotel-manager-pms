import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

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
