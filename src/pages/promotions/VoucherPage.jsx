import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime } from '../../lib/formatters.js'
import { getPromotion, isPercentType } from '../../lib/promotions.js'
import { useAsync } from '../../hooks/useAsync.js'
import { promotionService } from '../../services/promotion.service.js'

function VoucherPage() {
  const loadVouchers = useCallback(async () => asArray(await promotionService.myPromotions()), [])
  const { data: vouchers, error, loading, execute } = useAsync(loadVouchers, { initialData: [] })
  const [promotionId, setPromotionId] = useState('')
  const [promotionDetail, setPromotionDetail] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState('')
  const [acting, setActing] = useState(false)

  async function viewPromotion(event) {
    event.preventDefault()
    setActionError(null)
    setMessage('')
    setActing(true)
    try {
      setPromotionDetail(await promotionService.detail(Number(promotionId)))
    } catch (err) {
      setActionError(err)
    } finally {
      setActing(false)
    }
  }

  async function applyPromotion() {
    setActionError(null)
    setMessage('')
    const confirmed = window.confirm('Backend sẽ đánh dấu voucher này là ĐÃ DÙNG ngay lập tức. Chỉ tiếp tục nếu bạn thực sự muốn tiêu voucher ngoài bước đặt vé. Bạn có chắc không?')
    if (!confirmed) return
    setActing(true)
    try {
      const applied = await promotionService.apply(Number(promotionId))
      setMessage(`Đã áp dụng: ${applied?.name ?? 'khuyến mãi'}`)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setActing(false)
    }
  }

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
      setRedeemMessage('Voucher redeemed successfully!')
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
<<<<<<< HEAD
      <PageHeader eyebrow="Account" title="My voucher" description="Promotions and discount codes you own." />
=======
      <PageHeader eyebrow="Account" title="My voucher" description="Ưu đãi và mã giảm giá bạn đang sở hữu." />
      <ErrorMessage error={actionError} />
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="alert alert-info mb-0">Backend hiện chỉ trả về User promotion ID trong danh sách; Promotion ID cần lấy từ dữ liệu quản trị để xem/áp dụng.</div>

      <form className="panel form-row align-items-end" onSubmit={viewPromotion}>
        <label className="form-label">Promotion ID<input className="form-control" type="number" min="1" value={promotionId} onChange={(event) => setPromotionId(event.target.value)} required /></label>
        <button className="btn btn-outline-dark" type="submit" disabled={acting}>{acting ? 'Loading...' : 'View detail'}</button>
        <button className="btn btn-outline-danger" type="button" disabled={acting || !promotionDetail} onClick={applyPromotion}>Đánh dấu đã dùng (API)</button>
      </form>
      {promotionDetail ? <article className="panel"><dl className="detail-list"><dt>Name</dt><dd>{promotionDetail.name}</dd><dt>Type</dt><dd>{formatLabel(promotionDetail.promotionType)}</dd><dt>Value</dt><dd>{promotionDetail.discountValue}</dd><dt>Status</dt><dd>{promotionDetail.isActive ? 'Active' : 'Inactive'}</dd></dl></article> : null}
>>>>>>> origin/main

      <form className="panel redeem-voucher" onSubmit={handleRedeem}>
        <label className="form-label redeem-voucher__field">
          Enter voucher code
          <input
            className="form-control"
            name="code"
            placeholder="e.g. SUMMER10"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <button className="btn btn-danger" disabled={redeeming || !code.trim()} type="submit">
          {redeeming ? 'Redeeming...' : 'Redeem voucher'}
        </button>
        <ErrorMessage error={redeemError} title="Could not redeem voucher" />
        {redeemMessage ? <div className="alert alert-success mb-0">{redeemMessage}</div> : null}
      </form>

      <DataState
        data={vouchers}
        emptyTitle="No vouchers yet"
        emptyDescription="Vouchers and promotions you redeem will appear here."
        error={error}
        loading={loading}
      >
        <div className="module-grid">
<<<<<<< HEAD
          {vouchers.map((voucher) => {
            const promotion = getPromotion(voucher)
            return (
              <article className="module-card" key={promotion.id ?? promotion.promotionCode}>
                <h2>{promotion.name ?? promotion.promotionCode ?? 'Voucher'}</h2>
                <dl className="detail-list">
                  <dt>Code</dt>
                  <dd>{promotion.promotionCode ?? '-'}</dd>
                  <dt>Discount</dt>
                  <dd>
                    {promotion.discountValue
                      ? isPercentType(promotion.promotionType)
                        ? `${promotion.discountValue}%`
                        : formatCurrency(promotion.discountValue)
                      : '-'}
                  </dd>
                  <dt>Expires</dt>
                  <dd>{formatDateTime(promotion.endDate)}</dd>
                  <dt>Status</dt>
                  <dd><span className="status-pill">{promotion.isActive === false ? 'Expired' : 'Active'}</span></dd>
                </dl>
              </article>
            )
          })}
=======
          {vouchers.map((voucher) => (
            <article className="module-card" key={voucher.userPromotionId ?? voucher.id}>
              <h2>{voucher.promotion?.name ?? voucher.title ?? voucher.name ?? 'Voucher'}</h2>
              <p>{formatLabel(voucher.promotion?.promotionType ?? voucher.discountType)}</p>
              <dl className="detail-list">
                <dt>User promotion ID</dt>
                <dd>{voucher.userPromotionId ?? '-'}</dd>
                <dt>Giảm giá</dt>
                <dd>
                  {voucher.promotion?.discountValue ?? '-'}
                </dd>
                <dt>Nhận lúc</dt>
                <dd>{formatDateTime(voucher.assignedAt)}</dd>
                <dt>Trạng thái</dt>
                <dd><span className="status-pill">{formatLabel(voucher.status ?? (voucher.promotion?.isActive ? 'ACTIVE' : 'INACTIVE'))}</span></dd>
              </dl>
            </article>
          ))}
>>>>>>> origin/main
        </div>
      </DataState>
    </section>
  )
}

export default VoucherPage
