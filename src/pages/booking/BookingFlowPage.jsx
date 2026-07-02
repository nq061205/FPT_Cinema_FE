import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { bookingService } from '../../services/booking.service.js'

const initialForm = {
  showtimeId: '',
  seatIds: '',
  promotionId: '',
  productsJson: '[]',
}

function parseIds(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
}

function BookingFlowPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const payload = {
        showtimeId: Number(form.showtimeId),
        seatIds: parseIds(form.seatIds),
        products: JSON.parse(form.productsJson || '[]'),
        promotionId: form.promotionId ? Number(form.promotionId) : null,
      }

      const created = await bookingService.create(payload)
      setResult(created)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Checkout" title="Create booking" description="CreateBookingRequest mapped to /api/booking/create." />

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <ErrorMessage error={error} title="Booking failed" />

          <label className="form-label">
            Showtime ID
            <input className="form-control" name="showtimeId" value={form.showtimeId} onChange={updateField} required />
          </label>

          <label className="form-label">
            Seat IDs
            <input className="form-control" name="seatIds" value={form.seatIds} onChange={updateField} placeholder="1,2,3" required />
          </label>

          <label className="form-label">
            Promotion ID
            <input className="form-control" name="promotionId" value={form.promotionId} onChange={updateField} />
          </label>

          <label className="form-label">
            Products JSON
            <textarea className="form-control" name="productsJson" rows="4" value={form.productsJson} onChange={updateField} />
          </label>

          <button className="btn btn-danger" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create booking'}
          </button>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Booking result</h2>
          </div>
          {result ? (
            <dl className="detail-list">
              <dt>Code</dt>
              <dd>{result.bookingCode}</dd>
              <dt>Movie</dt>
              <dd>{result.movieTitle}</dd>
              <dt>Room</dt>
              <dd>{result.roomName}</dd>
              <dt>Start</dt>
              <dd>{formatDateTime(result.startTime)}</dd>
              <dt>Status</dt>
              <dd>{formatLabel(result.status)}</dd>
              <dt>Total</dt>
              <dd>{formatCurrency(result.finalAmount)}</dd>
            </dl>
          ) : (
            <p className="muted">Booking response will appear here.</p>
          )}
        </article>
      </div>
    </section>
  )
}

export default BookingFlowPage
