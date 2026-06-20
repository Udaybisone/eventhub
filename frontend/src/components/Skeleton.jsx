/** Card-shaped shimmer placeholder used while events load. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800" />
      <div className="animate-pulse space-y-3 p-4">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

/** A row of skeleton cards (rails). */
export function RailSkeleton({ count = 4 }) {
  return (
    <div className="-mx-1 flex gap-4 overflow-hidden px-1 pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-72 shrink-0">
          <CardSkeleton />
        </div>
      ))}
    </div>
  )
}

/** A responsive grid of skeleton cards. */
export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
