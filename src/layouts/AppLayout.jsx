import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { adminNavigation, mainNavigation } from '../config/navigation.js'
import { env } from '../config/env.js'
import { useAuth } from '../hooks/useAuth.js'

function AppLayout() {
  const navigate = useNavigate()
  const { hasPermission, hasRole, logout, user } = useAuth()
  const visibleAdminLinks = adminNavigation.filter((item) => {
    return hasRole(item.roles ?? []) && hasPermission(item.permissions ?? [])
  })

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">FC</span>
          <span>{env.appName}</span>
        </NavLink>

        <nav className="nav-stack" aria-label="Main navigation">
          {mainNavigation.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {visibleAdminLinks.length ? (
          <nav className="nav-stack nav-stack--admin" aria-label="Admin navigation">
            <span className="nav-label">Management</span>
            {visibleAdminLinks.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/admin'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
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

export default AppLayout
