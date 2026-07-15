import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminNavigation, customerNavigation, mainNavigation } from '../config/navigation.js'
import { env } from '../config/env.js'
import { useAuth } from '../hooks/useAuth.js'
import ChatbotWidget from '../components/chat/ChatbotWidget.jsx'
import Logo from '../assets/gemini-svg.svg'

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission, hasRole, logout, user } = useAuth()
  const isStaff = hasRole(['ADMIN', 'MANAGER'])
  const visibleMainLinks = isStaff
    ? []
    : [
        ...mainNavigation,
        ...customerNavigation.filter(
          (customerItem) => !mainNavigation.some((mainItem) => mainItem.path === customerItem.path)
        ),
      ]
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
        <NavLink to="/" className="brand" end>
          <img src={Logo} alt={env.appName} className="brand-logo" />
        </NavLink>

        {visibleMainLinks.length ? (
          <nav className="nav-stack" aria-label="Main navigation">
            {visibleMainLinks.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        {visibleAdminLinks.length ? (
          <nav
            className={`nav-stack${visibleMainLinks.length ? ' nav-stack--admin' : ''}`}
            aria-label="Admin navigation"
          >
            <span className="nav-label">Management</span>
            {visibleAdminLinks.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.end}>
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
      {location.pathname !== '/support' ? <ChatbotWidget /> : null}
    </div>
  )
}

export default AppLayout