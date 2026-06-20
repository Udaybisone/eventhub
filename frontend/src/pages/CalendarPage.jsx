import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJson } from '../api'
import { CATEGORY_OPTIONS, categoryLabel, categoryStyle, formatDateTime } from '../lib/format'

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
  const [active, setActive] = useState(new Set()) // empty = all categories
  const [selectedDay, setSelectedDay] = useState(null)
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

  const visible = useMemo(
    () => (active.size === 0 ? events : events.filter((e) => active.has(e.category))),
    [events, active],
  )

  const byDay = useMemo(() => {
    const map = {}
    for (const e of visible) {
      const d = new Date(e.startDateTime)
      if (d.getFullYear() === year && d.getMonth() === month) {
        ;(map[d.getDate()] ||= []).push(e)
      }
    }
    return map
  }, [visible, year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = new Date(year, month, 1).getDay()
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const todayDate = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  const goToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }
  const toggleCat = (c) =>
    setActive((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{monthLabel}</h1>
        <div className="flex gap-2">
          <button onClick={goToday} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Today
          </button>
          <button onClick={() => shift(-1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            ← Prev
          </button>
          <button onClick={() => shift(1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Next →
          </button>
        </div>
      </div>

      {/* Category filter chips (also the legend). Click to toggle; none selected = all. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((c) => {
          const on = active.size === 0 || active.has(c.value)
          return (
            <button
              key={c.value}
              onClick={() => toggleCat(c.value)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                on
                  ? 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  : 'border-transparent bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${categoryStyle(c.value).dot}`} />
              {c.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm dark:border-slate-800 dark:bg-slate-800">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dayEvents = day ? byDay[day] || [] : []
          const isToday = isCurrentMonth && day === todayDate
          return (
            <div
              key={i}
              onClick={() => dayEvents.length > 0 && setSelectedDay({ day, events: dayEvents })}
              className={`min-h-24 bg-white p-1.5 align-top dark:bg-slate-900 ${
                isToday ? 'ring-2 ring-inset ring-indigo-400' : ''
              } ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
            >
              {day && (
                <>
                  <div className={`mb-1 text-xs font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${categoryStyle(e.category).dot}`} />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Day popup */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {monthLabel.split(' ')[0]} {selectedDay.day} · {selectedDay.events.length} event
                {selectedDay.events.length > 1 ? 's' : ''}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {selectedDay.events.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/events/${e.id}`}
                    className="block rounded-lg border border-slate-200 p-3 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${categoryStyle(e.category).dot}`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{categoryLabel(e.category)}</span>
                    </div>
                    <div className="mt-1 font-medium text-slate-800 dark:text-slate-200">{e.title}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(e.startDateTime)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
