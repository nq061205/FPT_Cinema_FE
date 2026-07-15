import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { promotionService } from '../../services/promotion.service.js'

function VoucherPage() {
  const loadVouchers = useCallback(async () => asArray(await promotionService.myPromotions()), [])
  const { data: vouchers, error, loading, execute } = useAsync(loadVouchers, { initialData: [] })

  const [code, setCode] = useState('')
  const [redeemError, setRedeemError] = useState(null)
  const [redeemMessage, setRedeemMessage] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  async function handleRedeem(event) {
    event.preventDefault()
    if (!code.trim()) return

    setRedeeming(true)
    setRedeemError(null)
    setRedeemMessage('')

    try {
      await promotionService.apply(code.trim())
      setRedeemMessage('Đã lấy voucher thành công!')
      setCode('')
      await execute()
    } catch (err) {
      setRedeemError(err)
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="My voucher" description="Ưu đãi và mã giảm giá bạn đang sở hữu." />

      <form className="panel redeem-voucher" onSubmit={handleRedeem}>
        <label className="form-label redeem-voucher__field">
          Nhập mã voucher
          <input
            className="form-control"
            name="code"
            placeholder="VD: SUMMER10"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <button className="btn btn-danger" disabled={redeeming || !code.trim()} type="submit">
          {redeeming ? 'Đang lấy...' : 'Lấy voucher'}
        </button>
        <ErrorMessage error={redeemError} title="Không lấy được voucher" />
        {redeemMessage ? <div className="alert alert-success mb-0">{redeemMessage}</div> : null}
      </form>

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
