/**
 * Auth card. With `aside`, renders a two-panel layout (marketing panel + form)
 * on large screens; otherwise a simple centered card (used by reset flows).
 */
export default function AuthForm({ title, children, footer, aside }) {
  if (aside) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800 lg:grid-cols-2">
          <div className="hidden flex-col justify-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] p-8 text-white lg:flex">
            {aside}
          </div>
          <div className="bg-white p-6 sm:p-8 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            {children}
            {footer && <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
      </div>
    </div>
  )
}

/** Shared marketing panel for the login/register two-panel layout. */
export function AuthAside() {
  const points = [
    'Discover hackathons, contests & conferences in one feed',
    'Save events you care about',
    'Get reminders 24h and 1h before they start',
    'No duplicate listings to wade through',
  ]
  return (
    <div>
      <div className="text-2xl font-extrabold">EventHub</div>
      <p className="mt-2 text-indigo-100">Your career-opportunity feed for developers.</p>
      <ul className="mt-6 list-disc space-y-3 pl-5 text-sm marker:text-indigo-300/70">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}
