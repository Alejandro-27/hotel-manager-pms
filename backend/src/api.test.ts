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