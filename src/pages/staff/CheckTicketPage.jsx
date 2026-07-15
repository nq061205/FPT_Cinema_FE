import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { paymentService } from '../../services/payment.service.js'
import { ticketService } from '../../services/ticket.service.js'

function CheckTicketPage() {
  const [ticketCode, setTicketCode] = useState('')
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState(null)
  const [looking, setLooking] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [confirmingRefund, setConfirmingRefund] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLookup(event) {
    event.preventDefault()
    if (!ticketCode.trim()) return

    setLooking(true)
    setError(null)
    setMessage('')
    setTicket(null)

    try {
      const result = await ticketService.lookup(ticketCode.trim())
      setTicket(result)
    } catch (err) {
      setError(err)
    } finally {
      setLooking(false)
    }
  }

  async function handleCheckIn() {
    if (!ticket) return

    setCheckingIn(true)
    setError(null)

    try {
      await ticketService.checkIn(ticket.ticketCode)
      setTicket((current) => ({ ...current, status: 'USED', checkedInAt: new Date().toISOString() }))
      setMessage('Ticket check-in successful.')
    } catch (err) {
      setError(err)
    } finally {
      setCheckingIn(false)
    }
  }

  async function handleConfirmRefund() {
    if (!ticket) return

    setConfirmingRefund(true)
    setError(null)

    try {
      await paymentService.confirmRefund({ bookingId: ticket.bookingId })
      setTicket((current) => ({ ...current, refundCompleted: true, refundedAt: new Date().toISOString() }))
      setMessage('Refund confirmed successfully.')
    } catch (err) {
      setError(err)
    } finally {
      setConfirmingRefund(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader title="Check Ticket" description="Enter ticket code to view details and confirm use/refund." />

      <form className="panel redeem-voucher" onSubmit={handleLookup}>
        <label className="form-label redeem-voucher__field">
          Ticket Code
          <input
            className="form-control"
            name="ticketCode"
            placeholder="e.g., BK12345ABCDE-F10"
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
          />
        </label>
        <button className="btn btn-danger" disabled={looking || !ticketCode.trim()} type="submit">
          {looking ? 'Looking up...' : 'Lookup'}
        </button>
      </form>

      <ErrorMessage error={error} title="Unable to process ticket" />
      {message ? <div className="alert alert-success">{message}</div> : null}

      {ticket ? (
        <article className="panel">
          <div className="panel-header">
            <h2>{ticket.movieTitle ?? 'Movie Ticket'}</h2>
            <span className="status-pill">{formatLabel(ticket.status)}</span>
          </div>

          <dl className="detail-list">
            <dt>Ticket Code</dt>
            <dd>{ticket.ticketCode ?? '-'}</dd>
            <dt>Booking Code</dt>
            <dd>{ticket.bookingCode ?? '-'}</dd>
            <dt>Screening Room</dt>
            <dd>{ticket.roomName ?? '-'}</dd>
            <dt>Showtime</dt>
            <dd>{formatDateTime(ticket.startTime)}</dd>
            <dt>Seat</dt>
            <dd>{ticket.seatRow ?? ''}{ticket.seatNumber ?? ''}</dd>
            <dt>Total Price</dt>
            <dd>{formatCurrency(ticket.finalAmount)}</dd>
            {ticket.checkedInAt ? (
              <>
                <dt>Checked-in at</dt>
                <dd>{formatDateTime(ticket.checkedInAt)}</dd>
              </>
            ) : null}
          </dl>

          <div className="page-actions">
            {ticket.status === 'BOOKED' ? (
              <button className="btn btn-danger" disabled={checkingIn} onClick={handleCheckIn} type="button">
                {checkingIn ? 'Confirming...' : 'Confirm Ticket Used'}
              </button>
            ) : null}

            {ticket.refundRequested && !ticket.refundCompleted ? (
              <button className="btn btn-outline-dark" disabled={confirmingRefund} onClick={handleConfirmRefund} type="button">
                {confirmingRefund
                  ? 'Confirming...'
                  : `Confirm Refund (${ticket.refundMethod === 'CASH' ? 'cash' : 'online'})`}
              </button>
            ) : null}

            {ticket.refundCompleted ? (
              <span className="status-pill">Refunded · {formatDateTime(ticket.refundedAt)}</span>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default CheckTicketPage
