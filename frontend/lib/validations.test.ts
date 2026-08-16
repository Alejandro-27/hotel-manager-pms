import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, newRoomSchema, reservationSchema } from './validations'

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: '123' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('validates correct register data', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@email.com',
      hotel: 'Hotel Test',
      role: 'admin',
      password: '123456',
      confirmPassword: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@email.com',
      hotel: 'Hotel Test',
      role: 'admin',
      password: '123456',
      confirmPassword: '654321',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'john@email.com',
      hotel: 'Hotel Test',
      role: 'admin',
      password: '123456',
      confirmPassword: '123456',
    })
    expect(result.success).toBe(false)
  })
})

describe('newRoomSchema', () => {
  it('validates correct room data', () => {
    const result = newRoomSchema.safeParse({
      number: '101',
      floor: 1,
      type: 'doble',
      maxCapacity: 2,
      pricePerNight: 120,
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero capacity', () => {
    const result = newRoomSchema.safeParse({
      number: '101',
      floor: 1,
      type: 'doble',
      maxCapacity: 0,
      pricePerNight: 120,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = newRoomSchema.safeParse({
      number: '101',
      floor: 1,
      type: 'doble',
      maxCapacity: 2,
      pricePerNight: -10,
    })
    expect(result.success).toBe(false)
  })
})

describe('reservationSchema', () => {
  it('validates correct reservation data', () => {
    const result = reservationSchema.safeParse({
      guestId: 'g1',
      roomId: 'r101',
      checkIn: '2026-03-01',
      checkOut: '2026-03-05',
      guests: 2,
      paymentMethod: 'tarjeta',
    })
    expect(result.success).toBe(true)
  })

  it('rejects check-out before check-in', () => {
    const result = reservationSchema.safeParse({
      guestId: 'g1',
      roomId: 'r101',
      checkIn: '2026-03-05',
      checkOut: '2026-03-01',
      guests: 2,
      paymentMethod: 'tarjeta',
    })
    expect(result.success).toBe(false)
  })
})
