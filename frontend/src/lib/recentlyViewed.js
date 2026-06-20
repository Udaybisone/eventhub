// Client-side "recently viewed" history (no backend needed). Stores a small,
// self-contained snapshot of each event so the dashboard can render it directly.
const KEY = 'eventhub_recent'
const MAX = 8

export function recordView(event) {
  if (!event?.id) return
  const snapshot = {
    id: event.id,
    title: event.title,
    category: event.category,
    source: event.source,
    startDateTime: event.startDateTime,
    online: event.online,
    location: event.location,
    tags: event.tags || [],
    status: event.status,
  }
  const existing = getRecentlyViewed().filter((e) => e.id !== event.id)
  const next = [snapshot, ...existing].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}
