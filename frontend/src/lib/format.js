// Shared formatting + visual system for events.

const CATEGORY_META = {
  HACKATHON: { label: 'Hackathon', icon: '🏆' },
  CODING_CONTEST: { label: 'Coding Contest', icon: '💻' },
  WORKSHOP: { label: 'Workshop', icon: '📚' },
  WEBINAR: { label: 'Webinar', icon: '🎥' },
  MEETUP: { label: 'Meetup', icon: '🤝' },
  CONFERENCE: { label: 'Conference', icon: '🎤' },
  OPEN_SOURCE_EVENT: { label: 'Open Source', icon: '🌍' },
}

// Literal class strings (Tailwind can't see dynamically-built names).
const CATEGORY_STYLES = {
  HACKATHON: {
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
  },
  CODING_CONTEST: {
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
  WORKSHOP: {
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  WEBINAR: {
    chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    bar: 'bg-cyan-500',
    dot: 'bg-cyan-500',
  },
  MEETUP: {
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
  CONFERENCE: {
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  OPEN_SOURCE_EVENT: {
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    bar: 'bg-teal-500',
    dot: 'bg-teal-500',
  },
}

const FALLBACK_STYLE = {
  chip: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  bar: 'bg-slate-400',
  dot: 'bg-slate-400',
}

const STATUS_STYLES = {
  UPCOMING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  ONGOING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  PAST: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, m]) => ({
  value,
  label: m.label,
  icon: m.icon,
}))

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label || category
}

export function categoryIcon(category) {
  return CATEGORY_META[category]?.icon || '📌'
}

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || FALLBACK_STYLE
}

export function statusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.PAST
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Compact "x min/hour/day ago" for sync times and recency. */
export function relativeTime(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.round(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

/**
 * Human countdown to an event start. Returns { label, urgent } or null if it
 * has already started. Urgent (≤ 48h) is styled more prominently in the UI.
 */
export function countdown(iso) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return null

  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let label
  if (days >= 1) label = `Starts in ${days} day${days > 1 ? 's' : ''}`
  else if (hours >= 1) label = `Starts in ${hours} hour${hours > 1 ? 's' : ''}`
  else label = 'Starting soon'

  return { label, urgent: hours <= 48 }
}
