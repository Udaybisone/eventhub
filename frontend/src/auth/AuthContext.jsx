import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ApiError, rawRequest } from '../api'

const STORAGE_KEY = 'eventhub_session'
const AuthContext = createContext(null)

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

function writeSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  const persist = (s) => {
    writeSession(s)
    setSession(s)
  }

  const logout = () => persist(null)

  // Refresh using the stored (rotating) refresh token. Returns the new session or null.
  const tryRefresh = async () => {
    const current = readSession()
    if (!current?.refreshToken) return null
    const res = await rawRequest('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: current.refreshToken },
    })
    if (!res.ok) {
      persist(null)
      return null
    }
    const next = sessionFromAuthResponse(res.data)
    persist(next)
    return next
  }

  // Authenticated request with one transparent refresh-and-retry on 401.
  const authedRequest = async (path, opts = {}) => {
    const current = readSession()
    let res = await rawRequest(path, { ...opts, token: current?.accessToken })
    if (res.status === 401 && current?.refreshToken) {
      const refreshed = await tryRefresh()
      if (!refreshed) throw new ApiError(401, res.data)
      res = await rawRequest(path, { ...opts, token: refreshed.accessToken })
    }
    if (!res.ok) throw new ApiError(res.status, res.data)
    return res.data
  }

  const login = async (email, password) => {
    const res = await rawRequest('/api/auth/login', { method: 'POST', body: { email, password } })
    if (!res.ok) throw new ApiError(res.status, res.data)
    persist(sessionFromAuthResponse(res.data))
  }

  const register = async (email, password) => {
    const res = await rawRequest('/api/auth/register', { method: 'POST', body: { email, password } })
    if (!res.ok) throw new ApiError(res.status, res.data)
    persist(sessionFromAuthResponse(res.data))
  }

  const api = useMemo(
    () => ({
      get: (path) => authedRequest(path),
      post: (path, body) => authedRequest(path, { method: 'POST', body }),
      put: (path, body) => authedRequest(path, { method: 'PUT', body }),
      del: (path) => authedRequest(path, { method: 'DELETE' }),
    }),
    [],
  )

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      isAdmin: session?.role === 'ADMIN',
      login,
      register,
      logout,
      api,
    }),
    [session, api],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function sessionFromAuthResponse(data) {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    email: data.email,
    role: data.role,
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
