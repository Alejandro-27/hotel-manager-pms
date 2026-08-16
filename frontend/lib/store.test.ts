import { describe, it, expect } from 'vitest'
import {
  rooms,
  guests,
  reservations,
  products,
  sales,
  invoices,
  getGuestById,
  getRoomById,
  getProductById,
  getOccupancyRate,
  getDailyRevenue,
  getPendingCheckins,
  getLowStockProducts,
} from './store'

describe('Helper functions', () => {
  describe('getGuestById', () => {
    it('returns guest by id', () => {
      const guest = getGuestById('g1')
      expect(guest).toBeDefined()
      expect(guest?.name).toBe('Carlos Mendoza')
    })

    it('returns undefined for non-existent id', () => {
      const guest = getGuestById('nonexistent')
      expect(guest).toBeUndefined()
    })
  })

  describe('getRoomById', () => {
    it('returns room by id', () => {
      const room = getRoomById('r101')
      expect(room).toBeDefined()
      expect(room?.number).toBe('101')
      expect(room?.floor).toBe(1)
    })

    it('returns undefined for non-existent id', () => {
      const room = getRoomById('nonexistent')
      expect(room).toBeUndefined()
    })
  })

  describe('getProductById', () => {
    it('returns product by id', () => {
      const product = getProductById('p1')
      expect(product).toBeDefined()
      expect(product?.name).toBe('Desayuno Continental')
      expect(product?.price).toBe(12.50)
    })
  })

  describe('getOccupancyRate', () => {
    it('returns a number between 0 and 100', () => {
      const rate = getOccupancyRate()
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(100)
    })

    it('calculates correct occupancy', () => {
      const rate = getOccupancyRate()
      const occupied = rooms.filter(r => r.status === 'ocupada').length
      const expected = Math.round((occupied / rooms.length) * 100)
      expect(rate).toBe(expected)
    })
  })

  describe('getDailyRevenue', () => {
    it('returns a positive number', () => {
      const revenue = getDailyRevenue()
      expect(revenue).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getPendingCheckins', () => {
    it('returns only confirmed reservations', () => {
      const pending = getPendingCheckins()
      pending.forEach(res => {
        expect(res.status).toBe('confirmada')
      })
    })

    it('returns correct number of pending checkins', () => {
      const pending = getPendingCheckins()
      const expected = reservations.filter(r => r.status === 'confirmada').length
      expect(pending.length).toBe(expected)
    })
  })

  describe('getLowStockProducts', () => {
    it('returns products below minimum stock', () => {
      const lowStock = getLowStockProducts()
      lowStock.forEach(product => {
        expect(product.currentStock).toBeLessThan(product.minStock)
      })
    })
  })
})

describe('Data integrity', () => {
  it('has unique room ids', () => {
    const ids = rooms.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique guest ids', () => {
    const ids = guests.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique product ids', () => {
    const ids = products.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reservations reference valid guests', () => {
    reservations.forEach(res => {
      const guest = getGuestById(res.guestId)
      expect(guest).toBeDefined()
    })
  })

  it('reservations reference valid rooms', () => {
    reservations.forEach(res => {
      const room = getRoomById(res.roomId)
      expect(room).toBeDefined()
    })
  })

  it('sales reference valid products', () => {
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = getProductById(item.productId)
        expect(product).toBeDefined()
      })
    })
  })

  it('invoices reference valid reservations', () => {
    invoices.forEach(inv => {
      const reservation = reservations.find(r => r.id === inv.reservationId)
      expect(reservation).toBeDefined()
    })
  })

  it('has mock data', () => {
    expect(rooms.length).toBeGreaterThan(0)
    expect(guests.length).toBeGreaterThan(0)
    expect(reservations.length).toBeGreaterThan(0)
    expect(products.length).toBeGreaterThan(0)
    expect(sales.length).toBeGreaterThan(0)
    expect(invoices.length).toBeGreaterThan(0)
  })
})
