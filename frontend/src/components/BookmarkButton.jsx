import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Save/remove toggle for an event. Unauthenticated clicks redirect to login.
 * `initialSaved` seeds the state; `compact` renders the smaller card variant.
 */
export default function BookmarkButton({ eventId, initialSaved = false, compact = false }) {
  const { isAuthenticated, api } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  const toggle = async (e) => {
    e?.preventDefault?.()
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

  const size = compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-md font-medium transition disabled:opacity-50 ${size} ${
        saved
          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  )
}
