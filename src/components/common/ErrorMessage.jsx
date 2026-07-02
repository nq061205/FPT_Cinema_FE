function ErrorMessage({ error, title = 'Request failed' }) {
  if (!error) return null

  return (
    <div className="alert alert-danger" role="alert">
      <strong>{title}</strong>
      <span className="d-block">{error.message ?? String(error)}</span>
    </div>
  )
}

export default ErrorMessage
