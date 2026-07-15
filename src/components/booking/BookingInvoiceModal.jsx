import { useEffect } from 'react'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'

function BookingInvoiceModal({ booking, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const tickets = booking.tickets ?? []
  const products = booking.products ?? []

  return (
    <div className="invoice-modal" onClick={onClose}>
      <div className="invoice-modal__dialog" onClick={(event) => event.stopPropagation()}>
        <button className="invoice-modal__close" type="button" onClick={onClose} aria-label="Close invoice">
          ×
        </button>

        <div className="panel-header">
          <h2>Invoice · {booking.bookingCode ?? '-'}</h2>
          {booking.status ? <span className="status-pill">{formatLabel(booking.status)}</span> : null}
        </div>

        <dl className="detail-list">
          <dt>Movie</dt>
          <dd>{booking.movieTitle ?? '-'}</dd>
          <dt>Room</dt>
          <dd>{booking.roomName ?? '-'}</dd>
          <dt>Showtime</dt>
          <dd>{formatDateTime(booking.startTime)}</dd>
          {booking.method ? (
            <>
              <dt>Payment Method</dt>
              <dd>{formatLabel(booking.method)}</dd>
            </>
          ) : null}
          {booking.promotionCode ? (
            <>
              <dt>Voucher</dt>
              <dd>{booking.promotionName ?? booking.promotionCode} ({booking.promotionCode})</dd>
            </>
          ) : null}
        </dl>

        <h3 className="h6 mt-3">E-tickets ({tickets.length})</h3>
        {tickets.length ? (
          <ul className="invoice-ticket-list">
            {tickets.map((ticket) => (
              <li key={ticket.ticketCode}>
                <span>
                  {ticket.ticketCode} · Seat {ticket.seatRow}
                  {ticket.seatNumber} ({formatLabel(ticket.seatType)})
                </span>
                <span>{formatCurrency(ticket.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No detailed ticket data.</p>
        )}

        {products.length ? (
          <>
            <h3 className="h6 mt-3">F&B Items</h3>
            <ul className="invoice-ticket-list">
              {products.map((item, index) => (
                <li key={item.productName ?? index}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.totalPrice ?? Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1))}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <dl className="detail-list mt-3">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(booking.subtotal)}</dd>
          <dt>Discount</dt>
          <dd>{booking.discountAmount != null ? `-${formatCurrency(booking.discountAmount)}` : '-'}</dd>
          <dt>Total</dt>
          <dd><strong>{formatCurrency(booking.finalAmount)}</strong></dd>
        </dl>
      </div>
    </div>
  )
}

export default BookingInvoiceModal
