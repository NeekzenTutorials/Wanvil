const API_BASE = 'http://10.1.106.20:5000/api'

export async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown }
): Promise<T> {
  const url = `${API_BASE}/${path}`

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }

  if (init?.body != null) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const err = await response.json()
      message = err.error || JSON.stringify(err)
    } catch {}
    throw new Error(`API ${response.status} ${response.statusText}: ${message}`)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return (await response.json()) as T
}

export const apiGet = <T>(path: string) => apiFetch<T>(path, { method: 'GET' })
export const apiPost = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body })
export const apiPut = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body })
export const apiDelete = (path: string) => apiFetch<void>(path, { method: 'DELETE' })