import { useCallback } from 'react'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { promotionService } from '../../services/promotion.service.js'

function VoucherPage() {
  const loadVouchers = useCallback(async () => asArray(await promotionService.myPromotions()), [])
  const { data: vouchers, error, loading } = useAsync(loadVouchers, { initialData: [] })

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="My voucher" description="Ưu đãi và mã giảm giá bạn đang sở hữu." />

      <DataState
        data={vouchers}
        emptyTitle="Chưa có voucher"
        emptyDescription="Voucher và ưu đãi bạn nhận được sẽ hiển thị ở đây."
        error={error}
        loading={loading}
      >
        <div className="module-grid">
          {vouchers.map((voucher) => (
            <article className="module-card" key={voucher.id ?? voucher.code}>
              <h2>{voucher.title ?? voucher.name ?? voucher.code ?? 'Voucher'}</h2>
              <p>{voucher.description ?? formatLabel(voucher.discountType)}</p>
              <dl className="detail-list">
                <dt>Mã</dt>
                <dd>{voucher.code ?? '-'}</dd>
                <dt>Giảm giá</dt>
                <dd>
                  {voucher.discountPercent
                    ? `${voucher.discountPercent}%`
                    : voucher.discountAmount
                      ? `${voucher.discountAmount}đ`
                      : '-'}
                </dd>
                <dt>Hết hạn</dt>
                <dd>{formatDateTime(voucher.validTo ?? voucher.expiryDate)}</dd>
                <dt>Trạng thái</dt>
                <dd><span className="status-pill">{formatLabel(voucher.status)}</span></dd>
              </dl>
            </article>
          ))}
        </div>
      </DataState>
    </section>
  )
}

export default VoucherPage
