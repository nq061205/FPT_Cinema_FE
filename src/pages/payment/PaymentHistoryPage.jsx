import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { paymentService } from '../../services/payment.service.js'

function PaymentHistoryPage() {
  const loadPayments = useCallback(async () => asArray(await paymentService.history()), [])
  const { data: payments, error, loading } = useAsync(loadPayments, { initialData: [] })
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  async function handleViewDetails(paymentCode) {
    if (!paymentCode) return

    setDetailLoading(true)
    setDetailError(null)
    try {
      setSelectedPayment(await paymentService.getByCode(paymentCode))
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
        title="Lịch sử thanh toán"
        description="Các giao dịch thanh toán vé của bạn."
      />

      <ErrorMessage error={detailError} title="Không tải được chi tiết thanh toán" />

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
                <th>Mã giao dịch</th>
                <th>Mã booking</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th className="text-end">Số tiền</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.paymentCode ?? `${payment.bookingCode}-${payment.createdAt}`}>
                  <td>{payment.paymentCode ?? '-'}</td>
                  <td>{payment.bookingCode ?? '-'}</td>
                  <td>{formatLabel(payment.method ?? payment.paymentMethod)}</td>
                  <td><span className="status-pill">{formatLabel(payment.status)}</span></td>
                  <td>{formatDateTime(payment.paidAt ?? payment.createdAt)}</td>
                  <td className="text-end">{formatCurrency(payment.amount)}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={detailLoading || !payment.paymentCode}
                      onClick={() => handleViewDetails(payment.paymentCode)}
                      type="button"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      {selectedPayment ? (
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Payment detail</span>
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
