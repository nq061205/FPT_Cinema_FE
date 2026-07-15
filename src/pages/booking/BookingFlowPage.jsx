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
const STEP_LABELS = { 1: 'Select Seats', 2: 'Select F&B Items', 3: 'Discount Code', 4: 'Payment' }

function BookingFlowPage() {
  const [searchParams] = useSearchParams()
  const showtimeId = searchParams.get('showtimeId')
  const [step, setStep] = useState(1)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [quantities, setQuantities] = useState({})
  const [promotion, setPromotion] = useState(null)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)
  const [creating, setCreating] = useState(false)
  const [paymentMethod] = useState('VNPAY')
  const [paying, setPaying] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const loadBookingData = useCallback(async () => {
    if (!showtimeId || !Number.isInteger(Number(showtimeId)) || Number(showtimeId) < 1) return null

    const [showtime, seatMap] = await Promise.all([
      showtimeService.getById(showtimeId),
      seatService.viewMap({ showtimeId: Number(showtimeId) }),
    ])

    return { showtime, seatMap: { ...seatMap, seats: asArray(seatMap?.seats) } }
  }, [showtimeId])

  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 50 })), [])
  const loadVouchers = useCallback(async () => asArray(await promotionService.myPromotions()), [])
  const { data, error: loadError, loading } = useAsync(loadBookingData, { initialData: null })
  const { data: products, error: productsError, loading: productsLoading } = useAsync(loadProducts, { initialData: [] })
  const { data: allVouchers, error: vouchersError, loading: vouchersLoading, execute: refreshVouchers } = useAsync(loadVouchers, { initialData: [] })
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
  const discountAmount = useMemo(() => computeDiscount(promotion, subtotal), [promotion, subtotal])
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
  }

  async function handleCreateBooking() {
    if (!data?.showtime || !selectedSeatIds.length || !isBookable) return

    setCreating(true)
    setError(null)
    try {
      const created = await bookingService.create({
        showtimeId: data.showtime.id,
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionId: promotion?.id ?? null,
      })
      setBooking(created)
    } catch (err) {
      setError(err)
    } finally {
      setCreating(false)
    }
  }

  async function handlePay() {
    const bookingId = booking?.id
    setPaying(true)
    setError(null)
    try {
      const paid = await paymentService.process({ bookingId, method: paymentMethod })
      setInvoice(paid)
      setInvoiceOpen(true)
      setPromotion(null)
      await refreshVouchers()
    } catch (err) {
      setError(err)
    } finally {
      setPaying(false)
    }
  }

  if (!showtimeId) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="Checkout" title="Booking" description="Select a showtime before booking tickets" />
        <div className="panel"><Link className="btn btn-danger" to="/showtimes">View Showtimes</Link></div>
      </section>
    )
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Checkout" title="Booking" description={`Step ${step}/4: ${STEP_LABELS[step]}.`} />
      <DataState error={loadError} loading={loading}>
        {data ? (
          <div className="page-stack">
            <BookingSummaryBar
              seatCount={selectedSeatIds.length}
              productCount={selectedProducts.reduce((total, item) => total + item.quantity, 0)}
              subtotal={total}
              successMessage={invoice ? `Payment successful · ${invoice.bookingCode ?? booking?.bookingCode}` : null}
            />
            <div className="panel">
              <h2 className="h4">{data.showtime.movieTitle}</h2>
              <p className="muted">{data.seatMap.roomName ?? data.showtime.roomName} · {formatDateTime(data.showtime.startTime)} · {formatCurrency(data.showtime.basePrice)}</p>
              {!isBookable ? <ErrorMessage error={{ message: `Showtime is currently ${formatLabel(data.showtime.status)}. Only showtimes with status OPEN can be booked.` }} title="Showtime not open for booking" /> : null}

              {step === 1 ? (
                <>
                  {missingSeatIds ? <ErrorMessage error={{ message: 'Seat map API did not return seatId.' }} title="Missing seat data" /> : null}
                  <SeatPicker onToggle={toggleSeat} seats={seats} selectedSeatIds={selectedSeatIds} />
                  <p className="muted mt-3">Selected {selectedSeatIds.length} seats.</p>
                  <button className="btn btn-danger" disabled={!selectedSeatIds.length || missingSeatIds} onClick={() => setStep(2)} type="button">Continue</button>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  {productsLoading ? <p>Loading products...</p> : null}
                  <ErrorMessage error={productsError} title="Failed to load products" />
                  <ProductPicker onChangeQuantity={updateQuantity} products={products} quantities={quantities} />
                  <div className="d-flex gap-2 mt-3"><button className="btn btn-outline-dark" onClick={() => setStep(1)} type="button">Back</button><button className="btn btn-danger" onClick={() => setStep(3)} type="button">Continue</button></div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  {vouchersLoading ? <p>Loading vouchers...</p> : null}
                  <ErrorMessage error={vouchersError} title="Failed to load vouchers" />
                  {!vouchersLoading && !vouchers.length ? (
                    <p className="muted">
                      You do not have any vouchers yet. Go to <Link to="/vouchers">My voucher</Link> to enter a code and claim one first.
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
                              Code: {item.promotionCode ?? '-'} ·{' '}
                              {item.discountValue ? (isPercentType(item.promotionType) ? `${item.discountValue}%` : formatCurrency(item.discountValue)) : '-'}
                              {' '}· Expiry: {formatDateTime(item.endDate)}
                            </div>
                          </div>
                          <span className="status-pill">{selected ? 'Selected' : 'Select'}</span>
                        </button>
                      )
                    })}
                  </div>
                  {promotion ? (
                    <dl className="detail-list mt-3"><dt>Discount</dt><dd>-{formatCurrency(discountAmount)}</dd></dl>
                  ) : null}
                  <div className="d-flex gap-2 mt-3"><button className="btn btn-outline-dark" onClick={() => setStep(2)} type="button">Back</button><button className="btn btn-danger" onClick={() => setStep(4)} type="button">Continue to Confirm</button></div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <dl className="detail-list"><dt>Seats</dt><dd>{selectedSeatIds.length}</dd><dt>Ticket Total</dt><dd>{formatCurrency(ticketTotal)}</dd><dt>F&B Items</dt><dd>{formatCurrency(productTotal)}</dd><dt>Discount</dt><dd>-{formatCurrency(discountAmount)}</dd><dt>Total</dt><dd>{formatCurrency(total)}</dd></dl>

                  {!booking ? (
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-outline-dark" onClick={() => setStep(3)} type="button">Back</button>
                      <button className="btn btn-danger" disabled={creating || !isBookable} onClick={handleCreateBooking} type="button">
                        {creating ? 'Reserving seats...' : 'Reserve Seats'}
                      </button>
                    </div>
                  ) : !invoice ? (
                    <>
                      <p className="muted mt-3">
                        Seats reserved: {booking.bookingCode}. Please complete payment before {formatDateTime(booking.expiresAt)}.
                      </p>
                      <p className="muted">Payment via VNPay.</p>
                      <button className="btn btn-danger mt-3" disabled={paying} onClick={handlePay} type="button">
                        {paying ? 'Processing...' : 'Confirm Payment'}
                      </button>
                    </>
                  ) : (
                    <div className="d-flex gap-2 align-items-center mt-3">
                      <div className="alert alert-success mb-0">Payment successful · {invoice.paymentCode}</div>
                      <button className="btn btn-outline-dark btn-sm" onClick={() => setInvoiceOpen(true)} type="button">View Invoice</button>
                    </div>
                  )}
                </>
              ) : null}
              {error ? <div className="mt-3"><ErrorMessage error={error} title="Operation failed" /></div> : null}
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
