// Low-level API helper. Auth/refresh is layered on top in AuthContext.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export class ApiError extends Error {
  constructor(status, data) {
    super(typeof data === 'object' && data?.message ? data.message : `Request failed (${status})`)
    this.status = status
    this.data = data
  }
}

export async function rawRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { ok: res.ok, status: res.status, data }
}

/** Public GET helper: returns parsed JSON or throws ApiError. */
export async function getJson(path) {
  const res = await rawRequest(path)
  if (!res.ok) throw new ApiError(res.status, res.data)
  return res.data
}

export { API_BASE_URL }
