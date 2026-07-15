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
      <ErrorMessage error={actionError} />
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="alert alert-info mb-0">Backend hiện chỉ trả về User promotion ID trong danh sách; Promotion ID cần lấy từ dữ liệu quản trị để xem/áp dụng.</div>

      <form className="panel form-row align-items-end" onSubmit={viewPromotion}>
        <label className="form-label">Promotion ID<input className="form-control" type="number" min="1" value={promotionId} onChange={(event) => setPromotionId(event.target.value)} required /></label>
        <button className="btn btn-outline-dark" type="submit" disabled={acting}>{acting ? 'Loading...' : 'View detail'}</button>
        <button className="btn btn-outline-danger" type="button" disabled={acting || !promotionDetail} onClick={applyPromotion}>Đánh dấu đã dùng (API)</button>
      </form>
      {promotionDetail ? <article className="panel"><dl className="detail-list"><dt>Name</dt><dd>{promotionDetail.name}</dd><dt>Type</dt><dd>{formatLabel(promotionDetail.promotionType)}</dd><dt>Value</dt><dd>{promotionDetail.discountValue}</dd><dt>Status</dt><dd>{promotionDetail.isActive ? 'Active' : 'Inactive'}</dd></dl></article> : null}

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
        </div>
      </DataState>
    </section>
  )
}

export default VoucherPage
