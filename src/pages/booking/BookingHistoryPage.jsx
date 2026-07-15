import { useCallback, useState } from 'react'
import BookingInvoiceModal from '../../components/booking/BookingInvoiceModal.jsx'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'
import { paymentService } from '../../services/payment.service.js'

function refundStateLabel(payment) {
  if (payment.refundCompleted) return 'Refunded'
  if (payment.refundRequested) return 'Refund Pending'
  return null
}

function BookingHistoryPage() {
  // Lấy danh sách booking/payment kết hợp từ API
  const loadPayments = useCallback(async () => asArray(await bookingService.history({ page: 0, size: 20 })), [])
  const { data: payments, error, loading, execute } = useAsync(loadPayments, { initialData: [] })
  
  // State quản lý Hoàn tiền (Refund)
  const [refundOpenId, setRefundOpenId] = useState(null)
  const [refundMethod, setRefundMethod] = useState('ONLINE')
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState(null)

  // State quản lý Hóa đơn & Chi tiết thanh toán
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  function openRefundForm(bookingId) {
    setRefundOpenId(bookingId)
    setRefundMethod('ONLINE')
    setRefundError(null)
  }

  async function handleRequestRefund(bookingId) {
    setRefundSubmitting(true)
    setRefundError(null)

    try {
      await paymentService.requestRefund({ bookingId, method: refundMethod })
      setRefundOpenId(null)
      await execute()
    } catch (err) {
      setRefundError(err)
    } finally {
      setRefundSubmitting(false)
    }
  }

  async function handleViewDetails(paymentCode) {
    if (!paymentCode) return

    setDetailLoading(true)
    setDetailError(null)
    try {
      setSelectedPayment(await paymentService.getByCode(paymentCode))
      setSelectedBooking(null) // Đóng modal hóa đơn nếu đang mở
    } catch (err) {
      setDetailError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="Booking History"
        description="View your ticket booking history."
      />

      <ErrorMessage
        error={detailError || refundError}
        title="Failed to load data"
      />

      <DataState
        data={payments}
        emptyTitle="No bookings found"
        emptyDescription="Your booking history will appear here after you complete a booking."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Movie</th>
                <th>Date & Time</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Actions</th>
                <th className="text-end">Refund</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.paymentCode ?? payment.bookingCode ?? payment.id}>
                  <td>
                    <div className="fw-medium">{payment.paymentCode ?? payment.bookingCode ?? '-'}</div>
                    {payment.paymentCode && payment.bookingCode ? (
                      <div className="muted small">Booking: {payment.bookingCode}</div>
                    ) : null}
                  </td>
                  <td>{payment.movieTitle ?? '-'}</td>
                  <td>{formatDateTime(payment.startTime ?? payment.paidAt ?? payment.createdAt)}</td>
                  <td>{formatLabel(payment.method ?? payment.paymentMethod)}</td>
                  <td><span className="status-pill">{formatLabel(payment.status)}</span></td>
                  <td className="text-end fw-medium">{formatCurrency(payment.finalAmount ?? payment.amount)}</td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-outline-dark btn-sm" onClick={() => { setSelectedBooking(payment); setSelectedPayment(null) }} type="button">
                        Invoice
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={detailLoading || !payment.paymentCode}
                        onClick={() => handleViewDetails(payment.paymentCode)}
                        type="button"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                  <td className="text-end">
                    {refundStateLabel(payment) ? (
                      <div>
                        <span className="status-pill">{refundStateLabel(payment)}</span>
                        {payment.refundCompleted && payment.refundVoucherCode ? (
                          <div className="muted small mt-1">Voucher: {payment.refundVoucherCode}</div>
                        ) : null}
                      </div>
                    ) : payment.status === 'COMPLETED' ? (
                      refundOpenId === payment.id ? (
                        <div className="d-flex align-items-center gap-2 justify-content-end">
                          <select className="form-select form-select-sm w-auto" onChange={(event) => setRefundMethod(event.target.value)} value={refundMethod}>
                            <option value="ONLINE">Online</option>
                            <option value="CASH">Cash</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={refundSubmitting}
                            onClick={() => handleRequestRefund(payment.id)}
                            type="button"
                          >
                            {refundSubmitting ? 'Submitting...' : 'Confirm'}
                          </button>
                          <button className="btn btn-outline-dark btn-sm" onClick={() => setRefundOpenId(null)} type="button">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-outline-dark btn-sm" onClick={() => openRefundForm(payment.id)} type="button">
                          Request Refund
                        </button>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      {selectedBooking ? (
        <BookingInvoiceModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      ) : null}

      {selectedPayment ? (
        <article className="panel mt-4">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Payment Detail</span>
              <h2>{selectedPayment.paymentCode}</h2>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedPayment(null)} type="button">
              Close
            </button>
          </div>
          <dl className="detail-list">
            <dt>Booking Code</dt>
            <dd>{selectedPayment.bookingCode ?? '-'}</dd>
            <dt>Payment method</dt>
            <dd>{formatLabel(selectedPayment.method)}</dd>
            <dt>Status</dt>
            <dd>{formatLabel(selectedPayment.status)}</dd>
            <dt>Amount</dt>
            <dd>{formatCurrency(selectedPayment.amount)}</dd>
            <dt>Created at</dt>
            <dd>{formatDateTime(selectedPayment.createdAt)}</dd>
            <dt>Paid at</dt>
            <dd>{formatDateTime(selectedPayment.paidAt)}</dd>
          </dl>
        </article>
      ) : null}
    </section>
  )
}

export default BookingHistoryPage