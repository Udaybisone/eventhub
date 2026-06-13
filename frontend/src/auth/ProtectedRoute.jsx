import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Gate for authenticated routes; pass adminOnly to require ROLE_ADMIN. */
export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
