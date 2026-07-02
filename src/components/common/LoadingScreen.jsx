function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="loading-screen">
      <div className="spinner-border text-danger" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default LoadingScreen
