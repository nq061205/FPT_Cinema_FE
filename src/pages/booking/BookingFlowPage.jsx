import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BookingInvoiceModal from '../../components/booking/BookingInvoiceModal.jsx'
import BookingSummaryBar from '../../components/booking/BookingSummaryBar.jsx'
import ProductPicker from '../../components/booking/ProductPicker.jsx'
import SeatPicker, { getSeatId, isSeatAvailable } from '../../components/booking/SeatPicker.jsx'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { computeDiscount, getPromotion, isPercentType } from '../../lib/promotions.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'
import { paymentService } from '../../services/payment.service.js'
import { productService } from '../../services/product.service.js'
import { promotionService } from '../../services/promotion.service.js'
import { seatService } from '../../services/seat.service.js'
import { showtimeService } from '../../services/showtime.service.js'

const EMPTY_SEATS = []
const STEP_LABELS = { 1: 'Chọn Ghế', 2: 'Chọn Bắp Nước', 3: 'Khuyến Mãi', 4: 'Thanh Toán' }

function BookingFlowPage() {
  const [searchParams] = useSearchParams()
  const showtimeId = searchParams.get('showtimeId')
  const [step, setStep] = useState(1)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [quantities, setQuantities] = useState({})
  
  // Combined States
  const [promotion, setPromotion] = useState(null)
  const [promotionId, setPromotionId] = useState('')
  const [promotionDetail, setPromotionDetail] = useState(null)
  const [promotionError, setPromotionError] = useState(null)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)
  const [creating, setCreating] = useState(false)
  const [payment, setPayment] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('VNPAY')
  const [bankCode, setBankCode] = useState('VNBANK')
  const [paying, setPaying] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const loadBookingData = useCallback(async () => {
    if (!showtimeId || !Number.isInteger(Number(showtimeId)) || Number(showtimeId) < 1) return null

    const [showtime, seatMap] = await Promise.all([
      showtimeService.getById(showtimeId),
      seatService.viewMap({ showtimeId: Number(showtimeId) }),
    ])

    const roomId = seatMap?.roomId ?? showtime?.roomId
    let roomSeats = []
    if (roomId) {
      try {
        roomSeats = asArray(await seatService.getByRoom(roomId, { size: 500 }))
      } catch {
        roomSeats = []
      }
    }
    const idsByPosition = new Map(
      roomSeats.map((seat) => [`${seat.seatRow}-${seat.seatNumber}`, seat.id]),
    )
    const seats = asArray(seatMap?.seats).map((seat) => ({
      ...seat,
      id: seat.id ?? seat.seatId ?? idsByPosition.get(`${seat.seatRow}-${seat.seatNumber}`),
    }))

    return { showtime, seatMap: { ...seatMap, seats } }
  }, [showtimeId])

  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 50 })), [])
  const loadVouchers = useCallback(async () => asArray(await promotionService.myPromotions()), [])
  
  const { data, error: loadError, loading } = useAsync(loadBookingData, { initialData: null })
  const { data: products, error: productsError, loading: productsLoading } = useAsync(loadProducts, { initialData: [] })
  const { data: allVouchers, error: vouchersError, loading: vouchersLoading } = useAsync(loadVouchers, { initialData: [] })
  
  const vouchers = useMemo(
    () => allVouchers.filter((voucher) => getPromotion(voucher)?.isActive !== false),
    [allVouchers],
  )
  const seats = data?.seatMap?.seats ?? EMPTY_SEATS
  const missingSeatIds = useMemo(
    () => seats.some((seat) => isSeatAvailable(seat) && getSeatId(seat) === null),
    [seats],
  )
  const selectedProducts = products
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({ productId: product.id, quantity: quantities[product.id] }))
    
  const productTotal = selectedProducts.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return total + Number(product?.price ?? 0) * item.quantity
  }, 0)
  
  const ticketTotal = Number(data?.showtime?.basePrice ?? 0) * selectedSeatIds.length
  const subtotal = ticketTotal + productTotal
  
  // Combine logic for promotion (voucher vs manual ID)
  const activePromotion = promotion || promotionDetail
  const discountAmount = useMemo(() => computeDiscount(activePromotion, subtotal), [activePromotion, subtotal])
  const total = Math.max(0, subtotal - discountAmount)
  const isBookable = String(data?.showtime?.status).toUpperCase() === 'OPEN'

  function toggleSeat(seat) {
    const seatId = getSeatId(seat)
    if (!isSeatAvailable(seat) || seatId === null) return

    setSelectedSeatIds((current) => (
      current.includes(seatId) ? current.filter((id) => id !== seatId) : [...current, seatId]
    ))
  }

  function updateQuantity(productId, change) {
    setQuantities((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + change)
      return { ...current, [productId]: nextQuantity }
    })
  }

  function selectPromotion(voucher) {
    const nextPromotion = getPromotion(voucher)
    setPromotion((current) => (current?.id === nextPromotion?.id ? null : nextPromotion))
    // Clear manual promotion if a voucher is selected
    setPromotionDetail(null)
    setPromotionId('')
  }

  async function previewPromotion() {
    if (!promotionId) return
    setPromotionError(null)
    try {
      const detail = await promotionService.detail(Number(promotionId))
      setPromotionDetail(detail)
      setPromotion(null) // Clear selected voucher if manual ID is checked
    } catch (err) {
      setPromotionDetail(null)
      setPromotionError(err)
    }
  }

  async function handleCreateBooking() {
    if (!data?.showtime || !selectedSeatIds.length || !isBookable || booking) return

    setCreating(true)
    setError(null)
    try {
      const appliedPromoId = promotion?.id ?? (promotionDetail ? Number(promotionDetail.id) : null)
      const created = await bookingService.create({
        showtimeId: data.showtime.id,
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionId: appliedPromoId,
      })
      setBooking(created)
      setPayment(null)
      setPaymentError(null)
    } catch (err) {
      setError(err)
    } finally {
      setCreating(false)
    }
  }

  async function handlePayment(event) {
    event?.preventDefault()
    if (!booking?.bookingCode) return

    setPaying(true)
    setPaymentError(null)
    try {
      const createdPayment = await paymentService.create({
        bookingCode: booking.bookingCode,
        method: paymentMethod,
        bankCode: paymentMethod === 'VNPAY' ? bankCode : null,
      })
      setPayment(createdPayment)

      if (createdPayment?.paymentUrl) {
        window.location.assign(createdPayment.paymentUrl)
      } else {
        // Fallback in case of mock payment returning directly
        setInvoice(createdPayment)
        setInvoiceOpen(true)
      }
    } catch (err) {
      setPaymentError(err)
    } finally {
      setPaying(false)
    }
  }

  if (!showtimeId) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="Checkout" title="Đặt vé" description="Vui lòng chọn suất chiếu trước khi đặt vé" />
        <div className="panel"><Link className="btn btn-danger" to="/showtimes">Xem suất chiếu</Link></div>
      </section>
    )
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Checkout" title="Đặt vé" description={`Bước ${step}/4: ${STEP_LABELS[step]}.`} />
      <DataState error={loadError} loading={loading}>
        {data ? (
          <div className="page-stack">
            <BookingSummaryBar
              seatCount={selectedSeatIds.length}
              productCount={selectedProducts.reduce((total, item) => total + item.quantity, 0)}
              subtotal={total}
              successMessage={invoice ? `Thanh toán thành công · ${invoice.bookingCode ?? booking?.bookingCode}` : null}
            />
            <div className="panel">
              <h2 className="h4">{data.showtime.movieTitle}</h2>
              <p className="muted">{data.seatMap.roomName ?? data.showtime.roomName} · {formatDateTime(data.showtime.startTime)} · {formatCurrency(data.showtime.basePrice)}</p>
              {!isBookable ? <ErrorMessage error={{ message: `Suất chiếu đang ở trạng thái ${formatLabel(data.showtime.status)}. Chỉ những suất chiếu OPEN mới có thể đặt.` }} title="Không thể đặt vé" /> : null}

              {step === 1 ? (
                <>
                  {missingSeatIds ? <ErrorMessage error={{ message: 'API bản đồ ghế không trả về seatId.' }} title="Thiếu dữ liệu ghế" /> : null}
                  <SeatPicker onToggle={toggleSeat} seats={seats} selectedSeatIds={selectedSeatIds} />
                  <p className="muted mt-3">Đã chọn {selectedSeatIds.length} ghế.</p>
                  <button className="btn btn-danger" disabled={!selectedSeatIds.length || missingSeatIds} onClick={() => setStep(2)} type="button">Tiếp tục</button>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  {productsLoading ? <p>Đang tải sản phẩm...</p> : null}
                  <ErrorMessage error={productsError} title="Không tải được sản phẩm" />
                  <ProductPicker onChangeQuantity={updateQuantity} products={products} quantities={quantities} />
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-dark" onClick={() => setStep(1)} type="button">Quay lại</button>
                    <button className="btn btn-danger" onClick={() => setStep(3)} type="button">Tiếp tục</button>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="form-row mb-4 align-items-end">
                    <label className="form-label">Nhập mã Khuyến mãi (Tùy chọn)
                      <input className="form-control" type="number" min="1" value={promotionId} onChange={(event) => setPromotionId(event.target.value)} />
                    </label>
                    <button className="btn btn-outline-dark" type="button" onClick={previewPromotion} disabled={!promotionId}>Kiểm tra mã</button>
                  </div>
                  {promotionDetail ? <p className="text-success small mb-3">{promotionDetail.name} · {formatLabel(promotionDetail.promotionType)} · {promotionDetail.discountValue}</p> : null}
                  <ErrorMessage error={promotionError} title="Khuyến mãi không hợp lệ" />

                  {vouchersLoading ? <p>Đang tải voucher...</p> : null}
                  <ErrorMessage error={vouchersError} title="Không tải được voucher" />
                  {!vouchersLoading && !vouchers.length ? (
                    <p className="muted">
                      Bạn chưa có voucher nào. Hãy đến <Link to="/vouchers">Kho Voucher</Link> để lưu mã giảm giá nhé.
                    </p>
                  ) : null}
                  <div className="d-grid gap-2">
                    {vouchers.map((voucher) => {
                      const item = getPromotion(voucher)
                      const selected = promotion?.id === item.id
                      return (
                        <button
                          className={`border rounded p-3 d-flex align-items-center justify-content-between gap-3 text-start ${selected ? 'border-danger' : ''}`}
                          key={item.id ?? item.promotionCode}
                          onClick={() => selectPromotion(voucher)}
                          type="button"
                        >
                          <div>
                            <strong>{item.name ?? item.promotionCode ?? 'Voucher'}</strong>
                            <div className="muted small">
                              Mã: {item.promotionCode ?? '-'} ·{' '}
                              {item.discountValue ? (isPercentType(item.promotionType) ? `${item.discountValue}%` : formatCurrency(item.discountValue)) : '-'}
                              {' '}· HSD: {formatDateTime(item.endDate)}
                            </div>
                          </div>
                          <span className="status-pill">{selected ? 'Đang chọn' : 'Chọn'}</span>
                        </button>
                      )
                    })}
                  </div>
                  {activePromotion ? (
                    <dl className="detail-list mt-3"><dt>Giảm giá</dt><dd>-{formatCurrency(discountAmount)}</dd></dl>
                  ) : null}
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-outline-dark" onClick={() => setStep(2)} type="button">Quay lại</button>
                    <button className="btn btn-danger" onClick={() => setStep(4)} type="button">Tiếp tục xác nhận</button>
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <dl className="detail-list">
                    <dt>Số ghế</dt><dd>{selectedSeatIds.length}</dd>
                    <dt>Tiền vé</dt><dd>{formatCurrency(ticketTotal)}</dd>
                    <dt>Bắp nước</dt><dd>{formatCurrency(productTotal)}</dd>
                    <dt>Giảm giá</dt><dd>-{formatCurrency(discountAmount)}</dd>
                    <dt>Tổng cộng</dt><dd className="fw-bold">{formatCurrency(total)}</dd>
                  </dl>

                  {!booking ? (
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-outline-dark" onClick={() => setStep(3)} type="button" disabled={creating}>Quay lại</button>
                      <button className="btn btn-danger" disabled={creating || !isBookable} onClick={handleCreateBooking} type="button">
                        {creating ? 'Đang tạo vé...' : 'Xác nhận đặt vé'}
                      </button>
                    </div>
                  ) : (
                    <section className="border-top mt-4 pt-4">
                      <h3 className="h5">Thanh toán</h3>
                      <p className="muted">Mã vé: <strong>{booking.bookingCode}</strong>. Vui lòng hoàn tất thanh toán trước {formatDateTime(booking.expiresAt)}.</p>
                      
                      <form className="form-row align-items-end" onSubmit={handlePayment}>
                        <label className="form-label">
                          Phương thức
                          <select className="form-select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                            <option value="VNPAY">VNPay online</option>
                          </select>
                        </label>
                        <label className="form-label">
                          Ngân hàng
                          <select className="form-select" value={bankCode} onChange={(event) => setBankCode(event.target.value)}>
                            <option value="VNBANK">Ngân hàng nội địa</option>
                            <option value="NCB">NCB</option>
                            <option value="VNPAYQR">VNPay QR</option>
                          </select>
                        </label>
                        <button className="btn btn-danger" type="submit" disabled={paying}>
                          {paying ? 'Đang khởi tạo...' : 'Thanh toán ngay'}
                        </button>
                      </form>
                      
                      {payment ? <p className="text-success mt-3 mb-0">Mã thanh toán: {payment.paymentCode} · {formatLabel(payment.status)}</p> : null}
                      <ErrorMessage error={paymentError} title="Khởi tạo thanh toán thất bại" />
                    </section>
                  )}
                </>
              ) : null}
              {error ? <div className="mt-3"><ErrorMessage error={error} title="Thao tác thất bại" /></div> : null}
            </div>
          </div>
        ) : null}
      </DataState>

      {invoiceOpen && invoice ? (
        <BookingInvoiceModal booking={invoice} onClose={() => setInvoiceOpen(false)} />
      ) : null}
    </section>
  )
}

export default BookingFlowPage