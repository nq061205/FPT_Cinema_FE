import { Navigate, Outlet } from 'react-router-dom'
import { env } from '../config/env.js'
import { useAuth } from '../hooks/useAuth.js'
import LoadingScreen from '../components/common/LoadingScreen.jsx'

function AuthLayout() {
  const { bootstrapping, isAuthenticated } = useAuth()

  if (bootstrapping) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-label={env.appName}>
        <div className="brand auth-brand__logo">
          <span className="brand-mark">FC</span>
          <span>{env.appName}</span>
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
