import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { staffNavigation } from '../config/navigation.js'
import { env } from '../config/env.js'
import { useAuth } from '../hooks/useAuth.js'
import Logo from '../assets/gemini-svg.svg'

function StaffLayout() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/staff/check-ticket" className="brand">
          <img src={Logo} alt={env.appName} className="brand-logo" />
        </NavLink>

        <nav className="nav-stack" aria-label="Staff navigation">
          {staffNavigation.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="topbar-label">Signed in</span>
            <strong>{user?.fullName ?? user?.email ?? 'FPT Cinema member'}</strong>
          </div>
          <button className="btn btn-outline-dark btn-sm" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
