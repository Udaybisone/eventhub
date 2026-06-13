import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJson } from '../api'
import { categoryLabel } from '../lib/format'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthBounds(year, month) {
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
  return { first, last }
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const { first, last } = monthBounds(year, month)
    const q = new URLSearchParams({
      upcomingOnly: 'false',
      from: first.toISOString(),
      to: last.toISOString(),
      size: '200',
    })
    getJson(`/api/events?${q}`)
      .then((d) => !cancelled && setEvents(d.content))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [year, month])

  // Group events by day-of-month (local date of their start).
  const byDay = useMemo(() => {
    const map = {}
    for (const e of events) {
      const d = new Date(e.startDateTime)
      if (d.getFullYear() === year && d.getMonth() === month) {
        ;(map[d.getDate()] ||= []).push(e)
      }
    }
    return map
  }, [events, year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = new Date(year, month, 1).getDay()
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{monthLabel}</h2>
        <div className="flex gap-2">
          <button onClick={() => shift(-1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
            ← Prev
          </button>
          <button onClick={() => shift(1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
            Next →
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load events: {error}
        </div>
      )}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="min-h-24 bg-white p-1.5 align-top">
            {day && (
              <>
                <div className="mb-1 text-xs font-medium text-slate-400">{day}</div>
                <div className="space-y-1">
                  {(byDay[day] || []).slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      title={`${e.title} — ${categoryLabel(e.category)}`}
                      className="block truncate rounded bg-indigo-50 px-1 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
                    >
                      {e.title}
                    </Link>
                  ))}
                  {(byDay[day] || []).length > 3 && (
                    <div className="text-xs text-slate-400">+{byDay[day].length - 3} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
