import { useCallback, useMemo, useState } from 'react'
import BookingSummaryBar from '../../components/booking/BookingSummaryBar.jsx'
import ProductPicker from '../../components/booking/ProductPicker.jsx'
import SeatPicker, { getSeatId, isSeatAvailable } from '../../components/booking/SeatPicker.jsx'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'
import { movieService } from '../../services/movie.service.js'
import { paymentService } from '../../services/payment.service.js'
import { productService } from '../../services/product.service.js'
import { promotionService } from '../../services/promotion.service.js'
import { seatService } from '../../services/seat.service.js'
import { showtimeService } from '../../services/showtime.service.js'

function CounterBookingPage() {
  const [step, setStep] = useState(1)
  const [movieId, setMovieId] = useState(null)
  const [showtimeId, setShowtimeId] = useState(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [quantities, setQuantities] = useState({})
  const [promoCode, setPromoCode] = useState('')
  const [promotion, setPromotion] = useState(null)
  const [promoError, setPromoError] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null)

  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies, error: moviesError, loading: moviesLoading } = useAsync(loadMovies, { initialData: [] })

  const loadShowtimes = useCallback(async () => {
    if (!movieId) return []
    return asArray(await showtimeService.list({ movieId }))
  }, [movieId])
  const { data: showtimes, error: showtimesError, loading: showtimesLoading } = useAsync(loadShowtimes, { initialData: [] })

  const loadSeatMap = useCallback(async () => {
    if (!showtimeId) return []
    const seatMap = await seatService.viewMap({ showtimeId: Number(showtimeId) })
    return asArray(seatMap?.seats ?? seatMap)
  }, [showtimeId])
  const { data: seats, error: seatsError, loading: seatsLoading } = useAsync(loadSeatMap, { initialData: [] })

  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 50 })), [])
  const { data: products, error: productsError, loading: productsLoading } = useAsync(loadProducts, { initialData: [] })

  const selectedMovie = movies.find((movie) => String(movie.id) === String(movieId))
  const selectedShowtime = showtimes.find((showtime) => String(showtime.id) === String(showtimeId))

  const selectedProducts = products
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({ productId: product.id, quantity: quantities[product.id] }))
  const productCount = selectedProducts.reduce((total, item) => total + item.quantity, 0)
  const productTotal = selectedProducts.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return total + Number(product?.price ?? 0) * item.quantity
  }, 0)
  const ticketTotal = Number(selectedShowtime?.basePrice ?? 0) * selectedSeatIds.length
  const subtotal = ticketTotal + productTotal
  const discountAmount = useMemo(() => {
    if (!promotion) return 0
    if (promotion.discountPercent) return Math.round((subtotal * Number(promotion.discountPercent)) / 100)
    if (promotion.discountAmount) return Number(promotion.discountAmount)
    return 0
  }, [promotion, subtotal])
  const total = Math.max(0, subtotal - discountAmount)

  function chooseMovie(id) {
    setMovieId(id)
    setShowtimeId(null)
    setSelectedSeatIds([])
    setStep(2)
  }

  function chooseShowtime(id) {
    setShowtimeId(id)
    setSelectedSeatIds([])
    setStep(3)
  }

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

  async function handleApplyPromo(event) {
    event.preventDefault()
    if (!promoCode.trim()) return

    setPromoLoading(true)
    setPromoError(null)

    try {
      const detail = await promotionService.detail(promoCode.trim())
      setPromotion(detail)
    } catch (err) {
      setPromotion(null)
      setPromoError(err)
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromotion(null)
    setPromoCode('')
    setPromoError(null)
  }

  async function handleSubmit() {
    if (!showtimeId || !selectedSeatIds.length) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const created = await bookingService.create({
        showtimeId: Number(showtimeId),
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionId: promotion?.id ?? promotion?.promotionId ?? null,
      })
      const paid = await paymentService.process({ bookingId: created.id, method: paymentMethod })
      setResult(paid)
    } catch (err) {
      setSubmitError(err)
    } finally {
      setSubmitting(false)
    }
  }

  function startNewOrder() {
    setStep(1)
    setMovieId(null)
    setShowtimeId(null)
    setSelectedSeatIds([])
    setQuantities({})
    removePromo()
    setPaymentMethod('CASH')
    setResult(null)
    setSubmitError(null)
  }

  return (
    <section className="page-stack">
      <PageHeader title="Counter Ticket Sales" description="Select movies, showtimes, seats, and products for customers." />

      {result ? (
        <article className="panel">
          <div className="panel-header">
            <h2>Booking Successful</h2>
          </div>
          <dl className="detail-list">
            <dt>Booking Code</dt>
            <dd>{result.bookingCode}</dd>
            <dt>Movie</dt>
            <dd>{result.movieTitle}</dd>
            <dt>Room</dt>
            <dd>{result.roomName}</dd>
            <dt>Showtime</dt>
            <dd>{formatDateTime(result.startTime)}</dd>
            <dt>Total Amount</dt>
            <dd>{formatCurrency(result.finalAmount)}</dd>
          </dl>
          <button className="btn btn-danger" onClick={startNewOrder} type="button">New Order</button>
        </article>
      ) : (
        <>
          {step === 1 ? (
            <DataState error={moviesError} loading={moviesLoading}>
              <div className="movie-grid">
                {movies.map((movie) => (
                  <button className="module-card" key={movie.id} onClick={() => chooseMovie(movie.id)} type="button">
                    <h2>{movie.title}</h2>
                    <p>{formatLabel(movie.genre)} · {movie.durationMinutes ?? '-'} mins</p>
                  </button>
                ))}
              </div>
            </DataState>
          ) : null}

          {step === 2 ? (
            <DataState error={showtimesError} loading={showtimesLoading}>
              <div className="panel">
                <div className="panel-header">
                  <h2>{selectedMovie?.title}</h2>
                  <button className="btn btn-outline-dark btn-sm" onClick={() => setStep(1)} type="button">Change Movie</button>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Room</th>
                        <th className="text-end">Ticket Price</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {showtimes.map((showtime) => (
                        <tr key={showtime.id}>
                          <td>{formatDateTime(showtime.startTime)}</td>
                          <td>{showtime.roomName ?? `Room ${showtime.roomId}`}</td>
                          <td className="text-end">{formatCurrency(showtime.basePrice)}</td>
                          <td className="text-end">
                            <button className="btn btn-danger btn-sm" onClick={() => chooseShowtime(showtime.id)} type="button">
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DataState>
          ) : null}

          {step >= 3 ? (
            <div className="page-stack">
              <BookingSummaryBar productCount={productCount} seatCount={selectedSeatIds.length} subtotal={subtotal} />

              <div className="panel">
                <h2 className="h4">{selectedMovie?.title}</h2>
                <p className="muted">
                  {selectedShowtime?.roomName ?? `Room ${selectedShowtime?.roomId}`} · {formatDateTime(selectedShowtime?.startTime)} · {formatCurrency(selectedShowtime?.basePrice)}
                </p>

                {step === 3 ? (
                  <>
                    <div className="panel-header">
                      <h2>Select Seats</h2>
                      <button className="btn btn-outline-dark btn-sm" onClick={() => setStep(2)} type="button">Change Showtime</button>
                    </div>
                    <SeatPicker onToggle={toggleSeat} seats={seats} selectedSeatIds={selectedSeatIds} />
                    <p className="muted mt-3">Selected {selectedSeatIds.length} seats.</p>
                    <button className="btn btn-danger" disabled={!selectedSeatIds.length} onClick={() => setStep(4)} type="button">
                      Continue to F&B Items
                    </button>
                    <DataState error={seatsError} loading={seatsLoading} />
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <div className="panel-header">
                      <h2>Select F&B Items</h2>
                    </div>
                    <DataState error={productsError} loading={productsLoading}>
                      <ProductPicker onChangeQuantity={updateQuantity} products={products} quantities={quantities} />
                    </DataState>
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-outline-dark" onClick={() => setStep(3)} type="button">Back</button>
                      <button className="btn btn-danger" onClick={() => setStep(5)} type="button">Continue to Payment</button>
                    </div>
                  </>
                ) : null}

                {step === 5 ? (
                  <>
                    <div className="panel-header">
                      <h2>Apply Promo Code & Payment</h2>
                      <button className="btn btn-outline-dark btn-sm" onClick={() => setStep(4)} type="button">Back</button>
                    </div>

                    <form className="redeem-voucher" onSubmit={handleApplyPromo}>
                      <label className="form-label redeem-voucher__field">
                        Promo Code
                        <input
                          className="form-control"
                          disabled={Boolean(promotion)}
                          onChange={(event) => setPromoCode(event.target.value)}
                          placeholder="e.g. SUMMER10"
                          value={promoCode}
                        />
                      </label>
                      {promotion ? (
                        <button className="btn btn-outline-dark" onClick={removePromo} type="button">Remove</button>
                      ) : (
                        <button className="btn btn-danger" disabled={promoLoading || !promoCode.trim()} type="submit">
                          {promoLoading ? 'Applying...' : 'Apply'}
                        </button>
                      )}
                    </form>
                    <ErrorMessage error={promoError} title="Invalid promo code" />

                    <div className="form-label mt-3">
                      Payment Method
                      <select className="form-select" onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                        <option value="CASH">Cash</option>
                        <option value="VNPAY">VNPay</option>
                      </select>
                    </div>

                    <dl className="detail-list mt-3">
                      <dt>Ticket Total</dt>
                      <dd>{formatCurrency(ticketTotal)}</dd>
                      <dt>F&B Items</dt>
                      <dd>{formatCurrency(productTotal)}</dd>
                      <dt>Discount</dt>
                      <dd>-{formatCurrency(discountAmount)}</dd>
                      <dt>Total</dt>
                      <dd><strong>{formatCurrency(total)}</strong></dd>
                    </dl>

                    <ErrorMessage error={submitError} title="Booking failed" />

                    <button className="btn btn-danger" disabled={submitting} onClick={handleSubmit} type="button">
                      {submitting ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

export default CounterBookingPage
