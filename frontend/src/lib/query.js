// Builds the /api/events query string from the UI filter object.
export function buildEventQuery(filters, page, size) {
  const p = new URLSearchParams()
  p.set('upcomingOnly', 'true')
  p.set('page', String(page))
  p.set('size', String(size))

  if (filters.q?.trim()) p.set('q', filters.q.trim())
  if (filters.category) p.set('category', filters.category)
  if (filters.online !== '') p.set('online', filters.online)
  if (filters.from) p.set('from', `${filters.from}T00:00:00Z`)
  if (filters.to) p.set('to', `${filters.to}T23:59:59Z`)
  if (filters.tags?.trim()) {
    filters.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => p.append('tags', t))
  }
  return p.toString()
}

export const EMPTY_FILTERS = { q: '', category: '', online: '', tags: '', from: '', to: '' }
