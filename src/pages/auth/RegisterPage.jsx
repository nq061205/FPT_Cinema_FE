import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await register(form)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">FPT Cinema</span>
        <h2>Create account</h2>
      </div>

      <ErrorMessage error={error} title="Registration failed" />

      <label className="form-label">
        Full name
        <input className="form-control" name="fullName" value={form.fullName} onChange={updateField} required />
      </label>

      <label className="form-label">
        Email
        <input className="form-control" name="email" type="email" value={form.email} onChange={updateField} required />
      </label>

      <label className="form-label">
        Phone
        <input className="form-control" name="phone" value={form.phone} onChange={updateField} required />
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
          minLength={8}
        />
      </label>

      <button className="btn btn-danger w-100" type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create account'}
      </button>

      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </form>
  )
}

export default RegisterPage
