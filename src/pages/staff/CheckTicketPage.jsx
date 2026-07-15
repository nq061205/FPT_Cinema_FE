import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { bookingService } from '../../services/booking.service.js'

function isRefundPending(booking) {
  const refundStatus = (booking.refundStatus ?? '').toString().toUpperCase()
  return refundStatus === 'PENDING' || booking.refundPending === true
}

function isCheckedIn(booking) {
  return String(booking.status).toUpperCase() === 'COMPLETED' || booking.checkedIn === true
}

function CheckTicketPage() {
  const [ticketCode, setTicketCode] = useState('')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [refundLoading, setRefundLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleCheck(event) {
    event.preventDefault()
    if (!ticketCode.trim()) return

    setChecking(true)
    setError(null)
    setMessage('')
    setBooking(null)

    try {
      const result = await bookingService.checkByCode(ticketCode.trim())
      setBooking(result)
    } catch (err) {
      setError(err)
    } finally {
      setChecking(false)
    }
  }

  async function handleConfirmCheckIn() {
    if (!booking) return

    setCheckInLoading(true)
    setError(null)

    try {
      await bookingService.checkIn(booking.id ?? booking.bookingId)
      setBooking((current) => ({ ...current, status: 'COMPLETED', checkedIn: true }))
      setMessage('Đã xác nhận sử dụng vé.')
    } catch (err) {
      setError(err)
    } finally {
      setCheckInLoading(false)
    }
  }

  async function handleConfirmRefund() {
    if (!booking) return

    setRefundLoading(true)
    setError(null)

    try {
      await bookingService.confirmRefund(booking.id ?? booking.bookingId)
      setBooking((current) => ({ ...current, refundStatus: 'CONFIRMED', refundPending: false }))
      setMessage('Đã xác nhận hoàn tiền mặt cho khách.')
    } catch (err) {
      setError(err)
    } finally {
      setRefundLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Staff" title="Kiểm tra vé" description="Nhập mã vé để xem thông tin đặt vé chi tiết." />

      <form className="panel redeem-voucher" onSubmit={handleCheck}>
        <label className="form-label redeem-voucher__field">
          Mã vé (ticket code)
          <input
            className="form-control"
            name="ticketCode"
            placeholder="VD: TCK-000123"
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
          />
        </label>
        <button className="btn btn-danger" disabled={checking || !ticketCode.trim()} type="submit">
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra'}
        </button>
      </form>

      <ErrorMessage error={error} title="Không kiểm tra được vé" />
      {message ? <div className="alert alert-success">{message}</div> : null}

      {booking ? (
        <article className="panel">
          <div className="panel-header">
            <h2>{booking.movieTitle ?? 'Vé xem phim'}</h2>
            <span className="status-pill">{formatLabel(booking.status)}</span>
          </div>

          <dl className="detail-list">
            <dt>Mã đặt vé</dt>
            <dd>{booking.bookingCode ?? '-'}</dd>
            <dt>Khách hàng</dt>
            <dd>{booking.customerName ?? booking.userFullName ?? '-'}</dd>
            <dt>Số điện thoại</dt>
            <dd>{booking.customerPhone ?? booking.userPhone ?? '-'}</dd>
            <dt>Phòng chiếu</dt>
            <dd>{booking.roomName ?? '-'}</dd>
            <dt>Suất chiếu</dt>
            <dd>{formatDateTime(booking.startTime)}</dd>
            <dt>Ghế</dt>
            <dd>{(booking.seatLabels ?? booking.seats ?? []).join(', ') || '-'}</dd>
            <dt>Tổng tiền</dt>
            <dd>{formatCurrency(booking.finalAmount)}</dd>
          </dl>

          <div className="page-actions">
            {!isCheckedIn(booking) ? (
              <button className="btn btn-danger" disabled={checkInLoading} onClick={handleConfirmCheckIn} type="button">
                {checkInLoading ? 'Đang xác nhận...' : 'Xác nhận đã sử dụng vé'}
              </button>
            ) : (
              <span className="status-pill">Vé đã được sử dụng</span>
            )}

            {isRefundPending(booking) ? (
              <button className="btn btn-outline-dark" disabled={refundLoading} onClick={handleConfirmRefund} type="button">
                {refundLoading ? 'Đang xác nhận...' : 'Xác nhận đã trả tiền mặt'}
              </button>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default CheckTicketPage
