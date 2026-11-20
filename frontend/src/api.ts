export type Room = {
  id: number
  name: string
  capacity: number
  equipment: string[]
  description: string
}

export type Booking = {
  id: number
  room: Room
  starts_at: string
  ends_at: string
  status: 'confirmed' | 'cancelled' | 'completed'
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export async function api<T = unknown>(path: string, token?: string | null, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`
  const send = (accessToken?: string | null) => {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(url, { ...options, headers })
  }
  let response = await send(localStorage.getItem('easybooking.token') ?? token)
  if (response.status === 401 && !path.endsWith('/token/refresh/')) {
    const refresh = localStorage.getItem('easybooking.refresh')
    if (refresh) {
      const refreshResponse = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (refreshResponse.ok) {
        const renewed = await refreshResponse.json() as { access: string; refresh?: string }
        localStorage.setItem('easybooking.token', renewed.access)
        if (renewed.refresh) localStorage.setItem('easybooking.refresh', renewed.refresh)
        response = await send(renewed.access)
      }
    }
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; email?: string[]; username?: string[]; password?: string[]; non_field_errors?: string[] } | null
    const message = payload?.detail ?? payload?.email?.[0] ?? payload?.username?.[0] ?? payload?.password?.[0] ?? payload?.non_field_errors?.[0] ?? 'Une erreur est survenue. Vérifiez vos informations.'
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}