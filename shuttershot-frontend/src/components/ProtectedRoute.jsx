import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ownAreaFor(role) {
  if (role === 'ADMIN' || role === 'MODERATOR') return '/admin'
  if (role === 'CUSTOMER') return '/account'
  return '/dashboard'
}

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : null

  if (!isAuthenticated) {
    const loginPath = allowedRoles?.includes('ADMIN') || allowedRoles?.includes('MODERATOR') ? '/admin/login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role, not unauthenticated — send them to their own area
    // rather than bouncing back through the login form.
    return <Navigate to={ownAreaFor(user.role)} replace />
  }

  return <Outlet />
}
