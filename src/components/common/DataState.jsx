import EmptyState from './EmptyState.jsx'
import ErrorMessage from './ErrorMessage.jsx'

function DataState({ children, data, emptyTitle, emptyDescription, error, loading }) {
  if (loading) {
    return (
      <div className="panel data-state">
        <div className="spinner-border text-danger" role="status" aria-hidden="true" />
        <span>Loading data</span>
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (Array.isArray(data) && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return children
}

export default DataState
