import { useCallback } from 'react'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'

function PaymentHistoryPage() {
  const loadPayments = useCallback(async () => asArray(await bookingService.history({ page: 0, size: 20 })), [])
  const { data: payments, error, loading } = useAsync(loadPayments, { initialData: [] })

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="Lịch sử thanh toán" description="Các giao dịch thanh toán vé của bạn." />

      <DataState
        data={payments}
        emptyTitle="Chưa có giao dịch"
        emptyDescription="Lịch sử thanh toán sẽ hiển thị ở đây sau khi bạn đặt vé."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Phim</th>
                <th>Thời gian</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th className="text-end">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.bookingCode}>
                  <td>{payment.bookingCode}</td>
                  <td>{payment.movieTitle}</td>
                  <td>{formatDateTime(payment.startTime)}</td>
                  <td>{formatLabel(payment.paymentMethod)}</td>
                  <td><span className="status-pill">{formatLabel(payment.status)}</span></td>
                  <td className="text-end">{formatCurrency(payment.finalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default PaymentHistoryPage
