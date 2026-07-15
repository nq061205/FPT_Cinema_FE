import { formatCurrency } from '../../lib/formatters.js'

function BookingSummaryBar({ seatCount, productCount, subtotal, successMessage }) {
  return (
    <div className="panel d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
      <div className="d-flex flex-wrap gap-4">
        <span>Seats: <strong>{seatCount}</strong></span>
        <span>Products: <strong>{productCount}</strong></span>
        <span>Subtotal: <strong>{formatCurrency(subtotal)}</strong></span>
      </div>
      {successMessage ? <span className="text-success">{successMessage}</span> : null}
    </div>
  )
}

export default BookingSummaryBar
