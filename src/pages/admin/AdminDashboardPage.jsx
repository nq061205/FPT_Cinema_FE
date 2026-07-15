import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const modules = [
  { title: 'Rooms', path: '/admin/rooms', description: 'Room CRUD, status, seat maps.' },
  { title: 'Products', path: '/admin/products', description: 'Concessions used during checkout.' },
  { title: 'Movies', path: '/admin/movies', description: 'Create catalog entries used by schedules and chat.' },
  { title: 'Showtimes', path: '/admin/showtimes', description: 'Create and cancel individual or batch schedules.' },
  { title: 'Access control', path: '/admin/access', description: 'Manage permissions and role assignments.', roles: ['ADMIN'] },
  { title: 'Users', path: '/admin/users', description: 'Accounts, roles, permissions.', permissions: ['USER_VIEW_LIST'] },
  { title: 'Reports', path: '/admin/reports', description: 'Revenue, booking, payment, movie reports.' },
]

function AdminDashboardPage() {
  const { hasPermission, hasRole } = useAuth()
  const visibleModules = modules.filter((module) => (
    hasRole(module.roles ?? []) && hasPermission(module.permissions ?? [])
  ))

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Admin" description="Back office modules mapped to secured backend endpoints." />

      <div className="module-grid">
        {visibleModules.map((module) => (
          <Link className="module-card" key={module.path} to={module.path}>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default AdminDashboardPage
