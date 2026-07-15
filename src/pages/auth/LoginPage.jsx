import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { getRoleHome } from '../../lib/roleHome.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice] = useState(
    () => location.state?.notice ?? window.sessionStorage.getItem('auth_notice') ?? '',
  )

  useEffect(() => {
    window.sessionStorage.removeItem('auth_notice')
  }, [])

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const account = await login(form)
      const from = location.state?.from
      const destination = from
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : getRoleHome(account?.role)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in</h2>
      </div>

      {notice ? <div className="alert alert-success">{notice}</div> : null}

      <ErrorMessage error={error} title="Login failed" />

      <label className="form-label">
        Email
        <input
          className="form-control"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          required
          autoComplete="email"
        />
      </label>

      <label className="form-label">
        Password
        <input
          className="form-control"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          required
          autoComplete="current-password"
        />
      </label>

      <button className="btn btn-danger w-100" type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="auth-switch">
        New account? <Link to="/register">Register</Link>
      </p>
    </form>
  )
}

export default LoginPage