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
      <PageHeader eyebrow="Account" title="My voucher" description="Promotions and discount codes you own." />

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
        </div>
      </DataState>
    </section>
  )
}

export default VoucherPage
