// Central API client. Base URL comes from the build-time env so the same
// bundle can point at localhost in dev and the Render backend in production.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function getJson(path) {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}

export { API_BASE_URL }
