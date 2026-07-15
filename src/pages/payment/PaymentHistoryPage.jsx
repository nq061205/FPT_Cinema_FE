import { useCallback, useState } from 'react'
import BookingInvoiceModal from '../../components/booking/BookingInvoiceModal.jsx'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
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

function PaymentHistoryPage() {
  const loadPayments = useCallback(async () => asArray(await bookingService.history({ page: 0, size: 20 })), [])
  const { data: payments, error, loading, execute } = useAsync(loadPayments, { initialData: [] })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [refundOpenId, setRefundOpenId] = useState(null)
  const [refundMethod, setRefundMethod] = useState('ONLINE')
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState(null)

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

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="Payment History" description="Your ticket transaction history." />

      <DataState
        data={payments}
        emptyTitle="No transactions found"
        emptyDescription="Your payment history will appear here after you book tickets."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Transaction Code</th>
                <th>Movie</th>
                <th>Time</th>
                <th>Method</th>
                <th>Status</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Invoice</th>
                <th className="text-end">Refund</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.bookingCode}>
                  <td>{payment.bookingCode}</td>
                  <td>{payment.movieTitle}</td>
                  <td>{formatDateTime(payment.startTime)}</td>
                  <td>{formatLabel(payment.method)}</td>
                  <td><span className="status-pill">{formatLabel(payment.status)}</span></td>
                  <td className="text-end">{formatCurrency(payment.finalAmount)}</td>
                  <td className="text-end">
                    <button className="btn btn-outline-dark btn-sm" onClick={() => setSelectedBooking(payment)} type="button">
                      View Invoice
                    </button>
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
                          <select className="form-select form-select-sm" onChange={(event) => setRefundMethod(event.target.value)} value={refundMethod}>
                            <option value="ONLINE">Online</option>
                            <option value="CASH">Cash</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={refundSubmitting}
                            onClick={() => handleRequestRefund(payment.id)}
                            type="button"
                          >
                            {refundSubmitting ? 'Sending...' : 'Confirm'}
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

      <ErrorMessage error={refundError} title="Failed to submit refund request" />

      {selectedBooking ? (
        <BookingInvoiceModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      ) : null}
    </section>
  )
}

export default PaymentHistoryPage
