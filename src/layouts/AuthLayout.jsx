import { Navigate, Outlet } from 'react-router-dom'
import { env } from '../config/env.js'
import { useAuth } from '../hooks/useAuth.js'
import { getRoleHome } from '../lib/roleHome.js'
import LoadingScreen from '../components/common/LoadingScreen.jsx'
import Logo from '../assets/gemini-svg.svg'

function AuthLayout() {
  const { bootstrapping, isAuthenticated, user } = useAuth()

  if (bootstrapping) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to={getRoleHome(user?.role)} replace />

  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-label={env.appName}>
        <div className="brand auth-brand__logo">
          <img src={Logo} alt={env.appName} className="brand-logo" />
        </div>
        <h1>Cinema operations, tickets, rooms, reports.</h1>
        <p>One workspace for FPT Cinema team workflows.</p>
      </section>
      <section className="auth-panel">
        <Outlet />
      </section>
    </main>
  )
}

export default AuthLayout
