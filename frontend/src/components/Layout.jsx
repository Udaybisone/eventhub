import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const { isAuthenticated, isAdmin, session, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive
        ? 'text-indigo-600 dark:text-indigo-400'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-xl font-extrabold text-transparent">
            EventHub
          </Link>

          <nav className="no-scrollbar flex max-w-full items-center gap-3 overflow-x-auto sm:gap-4">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/explore" className={linkClass}>
              Explore
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              Calendar
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/saved" className={linkClass}>
                Saved
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}

            <NotificationBell />

            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                title={session.email}
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-400 dark:text-slate-600">
        EventHub — aggregated from Codeforces, confs.tech and more. No more checking ten sites by hand.
      </footer>
    </div>
  )
}
