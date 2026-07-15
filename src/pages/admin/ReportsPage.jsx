import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { BOOKING_STATUSES, MOVIE_STATUSES, PAYMENT_METHODS, REPORT_GROUPS, USER_STATUSES } from '../../constants/enums.js'
import { reportService } from '../../services/report.service.js'

const reportTypes = ['booking', 'payment', 'revenue', 'customer', 'promotion', 'movie']

function ReportsPage() {
  const [form, setForm] = useState({
    type: 'revenue',
    startDate: '',
    endDate: '',
    groupBy: 'DAY',
    paymentMethod: '',
    completedBookingsOnly: true,
    paymentStatus: '',
    statuses: [],
    channels: [],
    movieId: '',
    membershipLevel: '',
    userStatus: '',
    promotionCode: '',
    promotionType: '',
    movieStatus: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setResult(null)

    if (!form.startDate || !form.endDate) {
      setError(new Error('Start date and end date are required.'))
      return
    }
    if (form.startDate > form.endDate) {
      setError(new Error('Start date must be before or equal to end date.'))
      return
    }

    setLoading(true)

    try {
      const payload = {
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        groupBy: form.groupBy,
      }

      if (form.type === 'booking') {
        payload.statuses = form.statuses.length ? form.statuses : null
        payload.channels = form.channels.length ? form.channels : null
        payload.movieId = form.movieId ? Number(form.movieId) : null
      }
      if (form.type === 'payment') {
        payload.paymentStatus = form.paymentStatus || null
        payload.paymentMethod = form.paymentMethod || null
      }
      if (form.type === 'revenue') {
        payload.paymentMethod = form.paymentMethod || null
        payload.completedBookingsOnly = form.completedBookingsOnly
      }
      if (form.type === 'customer') {
        payload.membershipLevel = form.membershipLevel || null
        payload.userStatus = form.userStatus || null
      }
      if (form.type === 'promotion') {
        payload.promotionCode = form.promotionCode || null
        payload.promotionType = form.promotionType || null
      }
      if (form.type === 'movie') payload.movieStatus = form.movieStatus || null

      const response = await reportService[form.type](payload)
      setResult(response)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Analytics" title="Reports" description="Shared report filter for /api/reports endpoints." />
      <ErrorMessage error={error} />

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <label className="form-label">
            Report type
            <select className="form-select" name="type" value={form.type} onChange={updateField}>
              {reportTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label className="form-label">
              Start date
              <input className="form-control" name="startDate" type="date" value={form.startDate} onChange={updateField} required />
            </label>
            <label className="form-label">
              End date
              <input className="form-control" name="endDate" type="date" min={form.startDate || undefined} value={form.endDate} onChange={updateField} required />
            </label>
          </div>

          <label className="form-label">
            Group by
            <select className="form-select" name="groupBy" value={form.groupBy} onChange={updateField}>
              {REPORT_GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Payment method
            <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={updateField}>
              <option value="">All</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </label>

          {form.type === 'booking' ? <>
            <label className="form-label">Movie ID<input className="form-control" name="movieId" type="number" min="1" value={form.movieId} onChange={updateField} /></label>
            <label className="form-label">Booking statuses<select className="form-select" multiple name="statuses" value={form.statuses} onChange={(event) => setForm((current) => ({ ...current, statuses: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <label className="form-label">Channels<input className="form-control" name="channels" placeholder="ONLINE, COUNTER" value={form.channels.join(', ')} onChange={(event) => setForm((current) => ({ ...current, channels: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) }))} /></label>
          </> : null}
          {form.type === 'payment' ? <label className="form-label">Payment status<select className="form-select" name="paymentStatus" value={form.paymentStatus} onChange={updateField}><option value="">All</option>{['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}
          {form.type === 'customer' ? <>
            <label className="form-label">Membership level<input className="form-control" name="membershipLevel" placeholder="BRONZE / SILVER / GOLD" value={form.membershipLevel} onChange={updateField} /></label>
            <label className="form-label">User status<select className="form-select" name="userStatus" value={form.userStatus} onChange={updateField}><option value="">All</option>{USER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </> : null}
          {form.type === 'promotion' ? <>
            <label className="form-label">Promotion code<input className="form-control" name="promotionCode" value={form.promotionCode} onChange={updateField} /></label>
            <label className="form-label">Promotion type<input className="form-control" name="promotionType" placeholder="PERCENTAGE" value={form.promotionType} onChange={updateField} /></label>
          </> : null}
          {form.type === 'movie' ? <label className="form-label">Movie status<select className="form-select" name="movieStatus" value={form.movieStatus} onChange={updateField}><option value="">All</option>{MOVIE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : null}

          <label className="form-check">
            <input
              className="form-check-input"
              name="completedBookingsOnly"
              type="checkbox"
              checked={form.completedBookingsOnly}
              onChange={updateField}
            />
            <span className="form-check-label">Completed bookings only</span>
          </label>

          <button className="btn btn-danger" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate report'}
          </button>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Response</h2>
          </div>
          <pre className="json-preview">{result ? JSON.stringify(result, null, 2) : '{}'}</pre>
        </article>
      </div>
    </section>
  )
}

export default ReportsPage
