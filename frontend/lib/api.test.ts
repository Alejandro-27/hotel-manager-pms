import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError, onSessionExpired, emitSessionExpired } from './api'

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

function jsonResponse(body: unknown, status: number) {
  return { ok: status < 400, status, json: async () => body } as Response
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('ApiError', () => {
  it('expone status y message', () => {
    const error = new ApiError(404, 'no encontrado')
    expect(error.status).toBe(404)
    expect(error.message).toBe('no encontrado')
    expect(error.name).toBe('ApiError')
  })
})

describe('manejo de respuestas no-OK', () => {
  it('lanza ApiError con el mensaje del servidor', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'credenciales invalidas' }, 400))
    await expect(api.guests.get()).rejects.toThrow('credenciales invalidas')
  })

  it('lanza ApiError con mensaje por defecto si no hay detalle', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 500))
    const error = await api.rooms.get().catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toContain('500')
  })
})

describe('evento de sesión expirada y refresh', () => {
  it('dispara session-expired al recibir 401 en endpoint protegido y no poder refrescar', async () => {
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    mockFetch.mockResolvedValue(jsonResponse({ error: 'token invalido' }, 401))
    await api.rooms.get().catch(() => {})

    expect(listener).toHaveBeenCalledTimes(1)
    off()
  })

  it('reintenta la peticion si el refresh de sesion funciona', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'token invalido' }, 401))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 'u1', name: 'A', email: 'a@b.c', role: 'admin', hotelName: null }, token: 'new' }, 200))
      .mockResolvedValueOnce(jsonResponse([{ id: 'r1' }], 200))

    const result = await api.rooms.get()

    expect(result).toEqual([{ id: 'r1' }])
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('no reintenta la peticion si el refresh falla', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'sesion expirada' }, 401))
    const error = await api.rooms.get().catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('no dispara session-expired en login con 401', async () => {
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    mockFetch.mockResolvedValue(jsonResponse({ error: 'credenciales invalidas' }, 401))
    await api.auth.login({ email: 'a@b.c', password: 'x' }).catch(() => {})

    expect(listener).not.toHaveBeenCalled()
    off()
  })

  it('no dispara session-expired en auth/me con 401 (arranque sin sesión)', async () => {
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    mockFetch.mockResolvedValue(jsonResponse({ error: 'sin sesion' }, 401))
    await api.auth.me().catch(() => {})

    expect(listener).not.toHaveBeenCalled()
    off()
  })

  it('emitSessionExpired notifica a los listeners registrados', () => {
    const listener = vi.fn()
    const off = onSessionExpired(listener)
    emitSessionExpired()
    expect(listener).toHaveBeenCalledTimes(1)
    off()
  })
})