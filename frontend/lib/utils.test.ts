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
  it('formats EUR currency', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1234,56')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-50)
    expect(result).toContain('50,00')
  })
})
