const API_BASE = 'http://10.1.106.16:5006/api'

/**
 * Generic fetch helper for backend API.
 * @param path API endpoint path relative to /api, e.g. 'projects' or 'projects/<id>'.
 * @param init Optional fetch init (method, headers, body...).
 * @returns Parsed JSON response.
 * @throws Error if response is not ok.
 */
export async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown }
): Promise<T> {
  const url = `${API_BASE}/${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  })

  if (!response.ok) {
    // Try to parse error message from JSON
    let message = response.statusText
    try {
      const err = await response.json()
      message = err.error || JSON.stringify(err)
    } catch {
      // ignore parse errors
    }
    throw new Error(`API ${response.status} ${response.statusText}: ${message}`)
  }

  // If no content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  return (await response.json()) as T
}

/**
 * Convenience helpers
 */
export const apiGet = <T>(path: string) => apiFetch<T>(path, { method: 'GET' })
export const apiPost = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body })
export const apiPut = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body })
export const apiDelete = (path: string) => apiFetch<void>(path, { method: 'DELETE' })
