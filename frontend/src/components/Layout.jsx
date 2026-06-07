import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            EventHub
          </Link>
          <span className="hidden text-sm text-slate-500 sm:block">
            Hackathons, contests, meetups &amp; tech events in one place
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
        EventHub — aggregated from Codeforces, confs.tech and more.
      </footer>
    </div>
  )
}
