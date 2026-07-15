import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { paymentService } from '../../services/payment.service.js'

function PaymentReturnPage() {
  const [searchParams] = useSearchParams()
  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])
  const hasParams = Object.keys(params).length > 0

  const confirmReturn = useCallback(async () => {
    if (!hasParams) return null
    return paymentService.vnpayReturn(params)
  }, [hasParams, params])

  const { data: result, error, loading } = useAsync(confirmReturn)
  const success = result?.status === 'COMPLETED'

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Checkout" title="Kết quả thanh toán" description="Xác nhận giao dịch thanh toán VNPAY của bạn." />

      {!hasParams ? (
        <div className="panel">
          <p className="muted">Không có dữ liệu giao dịch. Vui lòng quay lại lịch sử thanh toán.</p>
          <Link className="btn btn-danger" to="/payment-history">Xem lịch sử thanh toán</Link>
        </div>
      ) : (
        <DataState error={error} loading={loading}>
          {result ? (
            <div className="panel form-grid" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div className="text-center my-4">
                {success ? (
                  <>
                    <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-success font-weight-bold">Thanh toán thành công!</h2>
                    <p className="text-muted">Cảm ơn bạn đã lựa chọn FPT Cinema. Giao dịch của bạn đã hoàn tất và vé đã được xác nhận.</p>
                  </>
                ) : (
                  <>
                    <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h2 className="text-danger font-weight-bold">Thanh toán thất bại</h2>
                    <p className="text-muted">Giao dịch thanh toán chưa được hoàn thành hoặc đã bị hủy.</p>
                  </>
                )}
              </div>

              <div className="border-top border-bottom py-3 my-2">
                <dl className="detail-list">
                  <dt>Trạng thái</dt>
                  <dd>
                    <span className={`status-pill ${success ? 'bg-success bg-opacity-10 text-success border-success' : 'bg-danger bg-opacity-10 text-danger border-danger'}`} style={{ borderColor: 'transparent' }}>
                      {formatLabel(result.status)}
                    </span>
                  </dd>
                  <dt>Mã giao dịch</dt>
                  <dd>{result.paymentCode ?? '-'}</dd>
                  <dt>Mã đặt vé</dt>
                  <dd><strong>{result.bookingCode ?? '-'}</strong></dd>
                  <dt>Số tiền</dt>
                  <dd className="text-danger font-weight-bold">{formatCurrency(result.amount)}</dd>
                  <dt>Kết quả</dt>
                  <dd>{result.message ?? '-'}</dd>
                </dl>
              </div>

              <div className="d-flex gap-3 justify-content-center mt-3">
                <Link className="btn btn-danger px-4" to="/bookings">Vé của tôi</Link>
                <Link className="btn btn-outline-dark px-4" to="/payment-history">Lịch sử thanh toán</Link>
                <Link className="btn btn-outline-secondary px-4" to="/">Trang chủ</Link>
              </div>
            </div>
          ) : null}
        </DataState>
      )}
    </section>
  )
}

export default PaymentReturnPage
