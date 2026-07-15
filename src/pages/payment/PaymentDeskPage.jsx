import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { paymentService } from '../../services/payment.service.js'
import { useAuth } from '../../hooks/useAuth.js'

function PaymentDeskPage() {
  const { hasRole } = useAuth()
  const canUseCashDesk = hasRole(['STAFF'])
  const [bookingCode, setBookingCode] = useState('')
  const [paymentCode, setPaymentCode] = useState('')
  const [created, setCreated] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function createCashPayment(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await paymentService.createCash(bookingCode.trim())
      setCreated(response)
      setPaymentCode(response?.paymentCode ?? '')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  async function confirmCashPayment(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      setConfirmed(await paymentService.confirmCash(paymentCode.trim()))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Staff" title="Cash payment desk" description="Create and confirm cash payments for counter bookings." />
      {!canUseCashDesk ? <div className="alert alert-warning">Cash payment creation and confirmation are restricted to STAFF by the backend.</div> : null}
      <ErrorMessage error={error} />
      <div className="grid-two">
        <form className="panel form-grid" onSubmit={createCashPayment}>
          <h2>Create cash payment</h2>
          <label className="form-label">Booking code<input className="form-control" value={bookingCode} onChange={(event) => setBookingCode(event.target.value)} required disabled={!canUseCashDesk} /></label>
          <button className="btn btn-danger" type="submit" disabled={loading || !canUseCashDesk}>{loading ? 'Working...' : 'Create payment'}</button>
          {created ? <dl className="detail-list"><dt>Payment code</dt><dd>{created.paymentCode}</dd><dt>Status</dt><dd>{formatLabel(created.status)}</dd><dt>Amount</dt><dd>{formatCurrency(created.amount)}</dd></dl> : null}
        </form>
        <form className="panel form-grid" onSubmit={confirmCashPayment}>
          <h2>Confirm cash received</h2>
          <label className="form-label">Payment code<input className="form-control" value={paymentCode} onChange={(event) => setPaymentCode(event.target.value)} required disabled={!canUseCashDesk} /></label>
          <button className="btn btn-outline-dark" type="submit" disabled={loading || !canUseCashDesk}>{loading ? 'Working...' : 'Confirm payment'}</button>
          {confirmed ? <dl className="detail-list"><dt>Booking</dt><dd>{confirmed.bookingCode}</dd><dt>Status</dt><dd>{formatLabel(confirmed.status)}</dd><dt>Paid at</dt><dd>{formatDateTime(confirmed.paidAt)}</dd></dl> : null}
        </form>
      </div>
    </section>
  )
}

export default PaymentDeskPage
