import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { PAYMENT_METHODS, REPORT_GROUPS } from '../../constants/enums.js'
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
    setLoading(true)

    try {
      const payload = {
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        groupBy: form.groupBy,
      }

      if (form.type === 'revenue') {
        payload.paymentMethod = form.paymentMethod || null
        payload.completedBookingsOnly = form.completedBookingsOnly
      }

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
              <input className="form-control" name="startDate" type="date" value={form.startDate} onChange={updateField} />
            </label>
            <label className="form-label">
              End date
              <input className="form-control" name="endDate" type="date" value={form.endDate} onChange={updateField} />
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
