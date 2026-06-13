import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Save/remove toggle for an event. Unauthenticated clicks redirect to login.
 * `initialSaved` seeds the state when the caller already knows it.
 */
export default function BookmarkButton({ eventId, initialSaved = false }) {
  const { isAuthenticated, api } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      if (saved) {
        await api.del(`/api/bookmarks/${eventId}`)
        setSaved(false)
      } else {
        await api.put(`/api/bookmarks/${eventId}`)
        setSaved(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        saved
          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
      }`}
    >
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  )
}
