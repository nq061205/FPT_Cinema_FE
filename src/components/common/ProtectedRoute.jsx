import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import LoadingScreen from './LoadingScreen.jsx'
import { getDefaultRouteForUser } from '../../lib/authRouting.js'

function ProtectedRoute({ roles = [], permissions = [] }) {
  const location = useLocation()
  const { bootstrapping, hasPermission, hasRole, isAuthenticated, user } = useAuth()

  if (bootstrapping) return <LoadingScreen label="Loading workspace" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRole(roles) || !hasPermission(permissions)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
