import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { isAuthenticated, isAdmin, session, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            EventHub
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink to="/" className={linkClass} end>
              Browse
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
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Logout
                <span className="ml-1 hidden text-xs text-slate-400 sm:inline">({session.email})</span>
              </button>
            ) : (
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            )}
          </nav>
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
