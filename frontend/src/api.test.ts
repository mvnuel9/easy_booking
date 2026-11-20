// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('client API', () => {
  it('sends the stored bearer token with authenticated requests', async () => {
    localStorage.setItem('easybooking.token', 'access-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api('/rooms/')

    expect(fetchMock.mock.calls[0][0]).toContain('/rooms/')
    expect(new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).get('Authorization')).toBe('Bearer access-token')
  })

  it('refreshes an expired access token and retries the request', async () => {
    localStorage.setItem('easybooking.token', 'expired-token')
    localStorage.setItem('easybooking.refresh', 'refresh-token')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Expired' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'new-access', refresh: 'new-refresh' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api('/rooms/')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('easybooking.token')).toBe('new-access')
    expect(localStorage.getItem('easybooking.refresh')).toBe('new-refresh')
  })
})