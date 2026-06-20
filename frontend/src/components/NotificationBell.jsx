import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { countdown } from '../lib/format'

const DAY = 86400000

/**
 * Lightweight, real notification center: surfaces the user's saved events that
 * start within 48 hours. Computed client-side from actual bookmarks — no
 * fabricated alerts.
 */
export default function NotificationBell() {
  const { isAuthenticated, api } = useAuth()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    api
      .get('/api/bookmarks?size=100')
      .then((d) => {
        if (cancelled) return
        const now = Date.now()
        const soon = d.content
          .filter((e) => {
            const t = new Date(e.startDateTime).getTime() - now
            return t > 0 && t <= 2 * DAY
          })
          .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
        setAlerts(soon)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, api])

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        🔔
        {alerts.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
              Notifications
            </div>
            {alerts.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                No saved events starting soon.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {alerts.map((e) => {
                  const cd = countdown(e.startDateTime)
                  return (
                    <li key={e.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <Link
                        to={`/events/${e.id}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {e.title}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">{cd?.label || 'Starting soon'}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
