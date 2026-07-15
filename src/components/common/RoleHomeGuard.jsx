import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { getRoleHome } from '../../lib/roleHome.js'
import LoadingScreen from './LoadingScreen.jsx'

function RoleHomeGuard({ children }) {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) return <LoadingScreen />

  const roleHome = getRoleHome(user?.role)
  if (roleHome !== '/') return <Navigate to={roleHome} replace />

  return children
}

export default RoleHomeGuard
