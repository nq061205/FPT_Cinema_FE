function EmptyState({ title = 'No data', description = 'There is nothing to display yet.', action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export default EmptyState
