import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'

function NotFoundPage() {
  return (
    <main className="center-page">
      <EmptyState
        title="Page not found"
        description="The requested route does not exist in this frontend."
        action={<Link className="btn btn-danger" to="/">Back to dashboard</Link>}
      />
    </main>
  )
}

export default NotFoundPage
