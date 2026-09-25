import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.js'

let app: FastifyInstance

beforeAll(async () => {
  app = buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

async function registerUser(email: string, name = 'Usuario Test'): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { name, email, password: 'Password123!' },
  })
  expect(res.statusCode).toBe(201)
  return (res.json() as { token: string }).token
}

async function loginAsAdmin(): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@test.com', password: 'Password123!' },
  })
  expect(res.statusCode).toBe(200)
  return (res.json() as { token: string }).token
}

describe('health', () => {
  it('responde 200 con status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})

describe('autenticacion', () => {
  it('rechaza rutas protegidas sin token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/rooms' })
    expect(res.statusCode).toBe(401)
  })

  it('rechaza login con credenciales invalidas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nadie@test.com', password: 'malapassword' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('expone el perfil del usuario autenticado', async () => {
    const token = await registerUser(`perfil-${Date.now()}@test.com`)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().role).toBe('recepcion')
  })
})

describe('expenses', () => {
  it('solo el admin puede crear y borrar gastos', async () => {
    const adminToken = await loginAsAdmin()
    const recepcionToken = await registerUser(`recepcion1-${Date.now()}@test.com`, 'Recepcion Test')

    const create = await app.inject({
      method: 'POST',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { category: 'servicios', amount: 125.5, date: '2026-09-10', note: 'Luz' },
    })
    expect(create.statusCode).toBe(201)
    const expenseId = (create.json() as { id: string }).id

    const forbidden = await app.inject({
      method: 'POST',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${recepcionToken}` },
      payload: { category: 'otros', amount: 10, date: '2026-09-10' },
    })
    expect(forbidden.statusCode).toBe(403)

    const list = await app.inject({
      method: 'GET',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${recepcionToken}` },
    })
    expect(list.statusCode).toBe(200)
    expect(list.json().some((e: { id: string }) => e.id === expenseId)).toBe(true)

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(del.statusCode).toBe(200)

    const delAgain = await app.inject({
      method: 'DELETE',
      url: `/api/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(delAgain.statusCode).toBe(404)
  })

  it('el informe financiero refleja los gastos del mes', async () => {
    const adminToken = await loginAsAdmin()
    await app.inject({
      method: 'POST',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { category: 'nominas', amount: 3000, date: '2026-09-05', note: 'Nomina' },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/financial?months=1',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const report = res.json() as { monthlyRevenue: { month: string; gastos: number }[] }
    const september = report.monthlyRevenue.find((m) => m.month === 'Sep')
    expect(september?.gastos).toBe(3000)
  })

  it('valida el parametro months', async () => {
    const token = await loginAsAdmin()
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/financial?months=0',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('auth profile y password', () => {
  it('actualiza el perfil', async () => {
    const token = await registerUser(`settings-${Date.now()}@test.com`, 'Nombre Inicial')
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/auth/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Nombre Nuevo', hotelName: 'Hotel Test' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Nombre Nuevo')
    expect(res.json().hotelName).toBe('Hotel Test')
  })

  it('rechaza contrasena actual incorrecta', async () => {
    const email = `pw-${Date.now()}@test.com`
    const token = await registerUser(email)
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/password',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'incorrecta', newPassword: 'NuevaContrasena9!' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('cambia la contrasena correctamente', async () => {
    const email = `pw2-${Date.now()}@test.com`
    const token = await registerUser(email)
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/password',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'Password123!', newPassword: 'NuevaContrasena9!' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })

    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'Password123!' },
    })
    expect(oldLogin.statusCode).toBe(401)

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'NuevaContrasena9!' },
    })
    expect(newLogin.statusCode).toBe(200)
  })
})

describe('reservas y productos', () => {
  it('solo el admin puede crear productos', async () => {
    const adminToken = await loginAsAdmin()
    const recepcionToken = await registerUser(`recepcionp-${Date.now()}@test.com`, 'Recepcion Test')

    const create = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Te', category: 'bebidas', price: 1.5, currentStock: 50, minStock: 10, image: '' },
    })
    expect(create.statusCode).toBe(201)

    const forbidden = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${recepcionToken}` },
      payload: { name: 'Cafe', category: 'bebidas', price: 1.5, currentStock: 50, minStock: 10, image: '' },
    })
    expect(forbidden.statusCode).toBe(403)
  })

  it('solo el admin puede editar y eliminar productos', async () => {
    const adminToken = await loginAsAdmin()
    const recepcionToken = await registerUser(`recepcionprod-${Date.now()}@test.com`, 'Recepcion Prod')

    const created = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Toast con aguacate', category: 'desayunos', price: 6, currentStock: 20, minStock: 5, image: '' },
    })
    expect(created.statusCode).toBe(201)
    const productId = (created.json() as { id: string }).id

    const forbiddenUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/products/${productId}`,
      headers: { authorization: `Bearer ${recepcionToken}` },
      payload: { name: 'Toast actualizado', price: 7 },
    })
    expect(forbiddenUpdate.statusCode).toBe(403)

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Toast con aguacate premium', price: 7.5, minStock: 3 },
    })
    expect(updated.statusCode).toBe(200)
    expect((updated.json() as { name: string; price: number; minStock: number }).name).toBe('Toast con aguacate premium')
    expect((updated.json() as { price: number }).price).toBe(7.5)
    expect((updated.json() as { minStock: number }).minStock).toBe(3)

    const forbiddenDelete = await app.inject({
      method: 'DELETE',
      url: `/api/products/${productId}`,
      headers: { authorization: `Bearer ${recepcionToken}` },
    })
    expect(forbiddenDelete.statusCode).toBe(403)

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(deleted.statusCode).toBe(204)

    const doubleDelete = await app.inject({
      method: 'DELETE',
      url: `/api/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(doubleDelete.statusCode).toBe(404)
  })

  it('cancelar una reserva dos veces falla con 409', async () => {
    const adminToken = await loginAsAdmin()
    const token = await registerUser(`res-${Date.now()}@test.com`)

    const guest = await app.inject({
      method: 'POST',
      url: '/api/guests',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Huesped Test', document: `DOC-${Date.now()}`, country: 'ES', email: 'h@t.com', phone: '600000000' },
    })
    const guestId = (guest.json() as { id: string }).id

    const room = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { number: `T-${Date.now()}`, floor: 1, type: 'doble', maxCapacity: 2, pricePerNight: 80 },
    })
    expect(room.statusCode).toBe(201)
    const roomId = (room.json() as { id: string }).id

    const created = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        guestId,
        roomId,
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guests: 1,
        paymentMethod: 'efectivo',
        notes: '',
      },
    })
    expect(created.statusCode).toBe(201)
    const reservationId = (created.json() as { id: string }).id

    const cancel1 = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${reservationId}/cancel`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(cancel1.statusCode).toBe(200)

    const cancel2 = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${reservationId}/cancel`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(cancel2.statusCode).toBe(409)
  })
})

describe('ciclo de vida de productos', () => {
  async function createProduct(name: string): Promise<string> {
    const adminToken = await loginAsAdmin()
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name, category: 'bebidas', price: 3, currentStock: 10, minStock: 2, image: '' },
    })
    expect(res.statusCode).toBe(201)
    return (res.json() as { id: string }).id
  }

  it('un PATCH parcial no pisa los campos no enviados', async () => {
    const adminToken = await loginAsAdmin()
    const id = await createProduct(`Agua-${Date.now()}`)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Agua mineral' },
    })
    expect(res.statusCode).toBe(200)

    const body = res.json() as { name: string; price: number; currentStock: number; minStock: number }
    expect(body.name).toBe('Agua mineral')
    expect(body.price).toBe(3)
    expect(body.currentStock).toBe(10)
    expect(body.minStock).toBe(2)
  })

  it('bloquea el borrado con 409 si el producto tiene historial de ventas', async () => {
    const adminToken = await loginAsAdmin()
    const id = await createProduct(`Jugo-${Date.now()}`)

    const sale = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { items: [{ productId: id, quantity: 1, unitPrice: 3 }], paymentMethod: 'efectivo' },
    })
    expect(sale.statusCode).toBe(201)

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(del.statusCode).toBe(409)

    const delAgain = await app.inject({
      method: 'DELETE',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(delAgain.statusCode).toBe(409)

    const list = await app.inject({
      method: 'GET',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    const products = list.json() as { id: string }[]
    expect(products.some((p) => p.id === id)).toBe(true)
  })

  it('rechaza vender un producto desactivado', async () => {
    const adminToken = await loginAsAdmin()
    const id = await createProduct(`Inactivo-${Date.now()}`)

    const deactivate = await app.inject({
      method: 'PATCH',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { active: false },
    })
    expect(deactivate.statusCode).toBe(200)
    expect((deactivate.json() as { active: boolean }).active).toBe(false)

    const sale = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { items: [{ productId: id, quantity: 1, unitPrice: 3 }], paymentMethod: 'efectivo' },
    })
    expect(sale.statusCode).toBe(409)
  })
})

describe('factura en curso por cargo a habitacion', () => {
  const isoDate = (offset: number): string => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
  }

  async function createStay() {
    const adminToken = await loginAsAdmin()
    const token = await registerUser(`estancia-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`)

    const guest = await app.inject({
      method: 'POST',
      url: '/api/guests',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Huesped Estancia', document: `DOC-E-${Date.now()}`, country: 'ES', email: 'e@t.com', phone: '600000001' },
    })
    expect(guest.statusCode).toBe(201)
    const guestId = (guest.json() as { id: string }).id

    const room = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { number: `E-${Date.now()}`, floor: 1, type: 'doble', maxCapacity: 2, pricePerNight: 80 },
    })
    expect(room.statusCode).toBe(201)
    const roomId = (room.json() as { id: string }).id

    const created = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        guestId,
        roomId,
        checkIn: isoDate(-3),
        checkOut: isoDate(1),
        guests: 1,
        paymentMethod: 'efectivo',
        advancePayment: 0,
        notes: '',
      },
    })
    expect(created.statusCode).toBe(201)
    const reservationId = (created.json() as { id: string }).id

    const checkin = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${reservationId}/checkin`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(checkin.statusCode).toBe(200)

    const product = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: `Cafe Estancia ${Date.now()}`, category: 'bebidas', price: 5, currentStock: 10, minStock: 2, image: '' },
    })
    expect(product.statusCode).toBe(201)
    const productId = (product.json() as { id: string }).id

    return { adminToken, token, guestId, roomId, reservationId, productId }
  }

  it('crea la factura en curso al instante y acumula cada cargo', async () => {
    const stay = await createStay()

    const sale1 = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${stay.token}` },
      payload: {
        items: [{ productId: stay.productId, quantity: 2, unitPrice: 5 }],
        paymentMethod: 'cargo_habitacion',
        roomId: stay.roomId,
      },
    })
    expect(sale1.statusCode).toBe(201)

    const list1 = await app.inject({
      method: 'GET',
      url: `/api/invoices?guestId=${stay.guestId}`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    expect(list1.statusCode).toBe(200)
    const invoices1 = list1.json() as {
      id: string
      reservationId: string
      roomNights: { nights: number; pricePerNight: number }
      cateringCharges: { productId: string; quantity: number; unitPrice: number }[]
      subtotal: number
      totalDue: number
      status: string
    }[]
    expect(invoices1).toHaveLength(1)
    const invoice = invoices1[0]
    expect(invoice.reservationId).toBe(stay.reservationId)
    expect(invoice.roomNights).toEqual({ nights: 4, pricePerNight: 80 })
    expect(invoice.cateringCharges).toHaveLength(1)
    expect(invoice.cateringCharges[0].quantity).toBe(2)
    expect(invoice.subtotal).toBe(330)
    expect(invoice.totalDue).toBe(330)
    expect(invoice.status).toBe('pendiente')

    const sale2 = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${stay.token}` },
      payload: {
        items: [{ productId: stay.productId, quantity: 1, unitPrice: 5 }],
        paymentMethod: 'cargo_habitacion',
        roomId: stay.roomId,
      },
    })
    expect(sale2.statusCode).toBe(201)

    const list2 = await app.inject({
      method: 'GET',
      url: `/api/invoices?guestId=${stay.guestId}`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    const invoices2 = list2.json() as {
      cateringCharges: { quantity: number }[]
      subtotal: number
      totalDue: number
    }[]
    expect(invoices2).toHaveLength(1)
    expect(invoices2[0].cateringCharges).toHaveLength(2)
    expect(invoices2[0].subtotal).toBe(335)
    expect(invoices2[0].totalDue).toBe(335)
  })

  it('el check-out finaliza la factura en curso sin duplicarla', async () => {
    const stay = await createStay()

    await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${stay.token}` },
      payload: {
        items: [{ productId: stay.productId, quantity: 2, unitPrice: 5 }],
        paymentMethod: 'cargo_habitacion',
        roomId: stay.roomId,
      },
    })

    const checkout = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${stay.reservationId}/checkout`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    expect(checkout.statusCode).toBe(200)

    const list = await app.inject({
      method: 'GET',
      url: `/api/invoices?guestId=${stay.guestId}`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    const invoices = list.json() as {
      roomNights: { nights: number }
      cateringCharges: { quantity: number }[]
      subtotal: number
      totalDue: number
      status: string
    }[]
    expect(invoices).toHaveLength(1)
    expect(invoices[0].roomNights.nights).toBe(4)
    expect(invoices[0].cateringCharges).toHaveLength(1)
    expect(invoices[0].subtotal).toBe(330)
    expect(invoices[0].totalDue).toBe(330)
    expect(invoices[0].status).toBe('pendiente')
  })

  it('cancelar una reserva con factura pendiente elimina la factura', async () => {
    const stay = await createStay()

    await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${stay.token}` },
      payload: {
        items: [{ productId: stay.productId, quantity: 2, unitPrice: 5 }],
        paymentMethod: 'cargo_habitacion',
        roomId: stay.roomId,
      },
    })

    const before = await app.inject({
      method: 'GET',
      url: `/api/invoices?guestId=${stay.guestId}`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    expect((before.json() as unknown[])).toHaveLength(1)

    const cancel = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${stay.reservationId}/cancel`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    expect(cancel.statusCode).toBe(200)

    const after = await app.inject({
      method: 'GET',
      url: `/api/invoices?guestId=${stay.guestId}`,
      headers: { authorization: `Bearer ${stay.token}` },
    })
    expect((after.json() as unknown[])).toHaveLength(0)
  })
})

describe('cors', () => {
  it('acepta un origin con barra final', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/guests/123',
      headers: {
        origin: 'http://localhost:3000/',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'authorization, content-type',
      },
    })

    expect(res.statusCode).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000/')
    expect(res.headers['access-control-allow-methods']).toContain('PATCH')
  })
})