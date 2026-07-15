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
  if (payment.refundCompleted) return 'Đã hoàn tiền'
  if (payment.refundRequested) return 'Đang chờ hoàn tiền'
  return null
}

function PaymentHistoryPage() {
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
        eyebrow="Tài khoản"
        title="Lịch sử thanh toán"
        description="Các giao dịch thanh toán vé của bạn."
      />

      <ErrorMessage error={detailError || refundError} title="Có lỗi xảy ra khi tải dữ liệu" />

      <DataState
        data={payments}
        emptyTitle="Chưa có giao dịch"
        emptyDescription="Lịch sử thanh toán sẽ hiển thị ở đây sau khi bạn thanh toán một booking."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Mã giao dịch / Booking</th>
                <th>Phim</th>
                <th>Thời gian</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th className="text-end">Số tiền</th>
                <th className="text-end">Thao tác</th>
                <th className="text-end">Hoàn tiền</th>
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
                        Hóa đơn
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={detailLoading || !payment.paymentCode}
                        onClick={() => handleViewDetails(payment.paymentCode)}
                        type="button"
                      >
                        Chi tiết
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
                            <option value="CASH">Tiền mặt</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={refundSubmitting}
                            onClick={() => handleRequestRefund(payment.id)}
                            type="button"
                          >
                            {refundSubmitting ? 'Đang gửi...' : 'Xác nhận'}
                          </button>
                          <button className="btn btn-outline-dark btn-sm" onClick={() => setRefundOpenId(null)} type="button">
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-outline-dark btn-sm" onClick={() => openRefundForm(payment.id)} type="button">
                          Yêu cầu hoàn tiền
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
              <span className="eyebrow">Chi tiết thanh toán</span>
              <h2>{selectedPayment.paymentCode}</h2>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedPayment(null)} type="button">
              Đóng
            </button>
          </div>
          <dl className="detail-list">
            <dt>Mã booking</dt>
            <dd>{selectedPayment.bookingCode ?? '-'}</dd>
            <dt>Phương thức</dt>
            <dd>{formatLabel(selectedPayment.method)}</dd>
            <dt>Trạng thái</dt>
            <dd>{formatLabel(selectedPayment.status)}</dd>
            <dt>Số tiền</dt>
            <dd>{formatCurrency(selectedPayment.amount)}</dd>
            <dt>Khởi tạo</dt>
            <dd>{formatDateTime(selectedPayment.createdAt)}</dd>
            <dt>Thanh toán</dt>
            <dd>{formatDateTime(selectedPayment.paidAt)}</dd>
          </dl>
        </article>
      ) : null}
    </section>
  )
}

export default PaymentHistoryPage