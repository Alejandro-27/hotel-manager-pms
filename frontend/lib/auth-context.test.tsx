import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-context'

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

function jsonResponse(body: unknown, status: number) {
  return { ok: status < 400, status, json: async () => body } as Response
}

function Probe() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <span>loading</span>
  return <span data-testid="user">{user ? user.name : 'null'}</span>
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('AuthProvider', () => {
  it('carga el usuario al arrancar', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 'u1', name: 'Ana', email: 'a@b.c', role: 'admin', hotelName: null }, 200))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    expect(screen.getByText('loading')).toBeTruthy()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Ana'))
  })

  it('deja sin sesion si el evento session-expired se dispara', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 'u1', name: 'Ana', email: 'a@b.c', role: 'admin', hotelName: null }, 200))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Ana'))

    act(() => {
      window.dispatchEvent(new CustomEvent('session-expired'))
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))
  })
})