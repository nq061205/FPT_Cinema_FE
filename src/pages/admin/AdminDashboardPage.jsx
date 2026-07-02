import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'

const modules = [
  { title: 'Rooms', path: '/admin/rooms', description: 'Room CRUD, status, seat maps.' },
  { title: 'Users', path: '/admin/users', description: 'Accounts, roles, permissions.' },
  { title: 'Reports', path: '/admin/reports', description: 'Revenue, booking, payment, movie reports.' },
]

function AdminDashboardPage() {
  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Admin" description="Back office modules mapped to secured backend endpoints." />

      <div className="module-grid">
        {modules.map((module) => (
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
