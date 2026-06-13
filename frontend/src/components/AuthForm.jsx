/** Shared card wrapper for the small auth forms. */
export default function AuthForm({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
        {children}
      </div>
      {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
    </div>
  )
}
