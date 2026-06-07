// Shared formatting helpers for events.

const CATEGORY_LABELS = {
  HACKATHON: 'Hackathon',
  CODING_CONTEST: 'Coding Contest',
  WORKSHOP: 'Workshop',
  WEBINAR: 'Webinar',
  MEETUP: 'Meetup',
  CONFERENCE: 'Conference',
  OPEN_SOURCE_EVENT: 'Open Source',
}

const STATUS_STYLES = {
  UPCOMING: 'bg-emerald-100 text-emerald-700',
  ONGOING: 'bg-amber-100 text-amber-700',
  PAST: 'bg-slate-200 text-slate-600',
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category
}

export function statusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.PAST
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
