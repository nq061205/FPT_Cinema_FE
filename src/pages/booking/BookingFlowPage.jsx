import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'
import { productService } from '../../services/product.service.js'
import { seatService } from '../../services/seat.service.js'
import { showtimeService } from '../../services/showtime.service.js'

const EMPTY_SEATS = []

function getSeatId(seat) {
  return seat.id ?? seat.seatId ?? null
}

function isAvailable(seat) {
  return String(seat.status).toUpperCase() === 'AVAILABLE'
}

function BookingFlowPage() {
  const [searchParams] = useSearchParams()
  const showtimeId = searchParams.get('showtimeId')
  const [step, setStep] = useState(1)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [quantities, setQuantities] = useState({})
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadBookingData = useCallback(async () => {
    if (!showtimeId || !Number.isInteger(Number(showtimeId)) || Number(showtimeId) < 1) return null

    const [showtime, seatMap] = await Promise.all([
      showtimeService.getById(showtimeId),
      seatService.viewMap({ showtimeId: Number(showtimeId) }),
    ])

    return { showtime, seatMap: { ...seatMap, seats: asArray(seatMap?.seats) } }
  }, [showtimeId])

  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 50 })), [])
  const { data, error: loadError, loading } = useAsync(loadBookingData, { initialData: null })
  const { data: products, error: productsError, loading: productsLoading } = useAsync(loadProducts, { initialData: [] })
  const seats = data?.seatMap?.seats ?? EMPTY_SEATS
  const missingSeatIds = useMemo(
    () => seats.some((seat) => isAvailable(seat) && getSeatId(seat) === null),
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
  const isBookable = String(data?.showtime?.status).toUpperCase() === 'OPEN'

  function toggleSeat(seat) {
    const seatId = getSeatId(seat)
    if (!isAvailable(seat) || seatId === null) return

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

  async function handleSubmit() {
    if (!data?.showtime || !selectedSeatIds.length || !isBookable) return

    setSubmitting(true)
    setError(null)
    try {
      const created = await bookingService.create({
        showtimeId: data.showtime.id,
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionId: null,
      })
      setResult(created)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!showtimeId) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="Checkout" title="Đặt vé" description="Chọn một suất chiếu trước khi đặt vé." />
        <div className="panel"><Link className="btn btn-danger" to="/showtimes">Xem suất chiếu</Link></div>
      </section>
    )
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Checkout" title="Đặt vé" description={`Bước ${step}/3: ${step === 1 ? 'Chọn ghế' : step === 2 ? 'Chọn sản phẩm' : 'Xác nhận'}.`} />
      <DataState error={loadError} loading={loading}>
        {data ? (
          <div className="page-stack">
            <div className="panel d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
              <div className="d-flex flex-wrap gap-4">
                <span>Ghế: <strong>{selectedSeatIds.length}</strong></span>
                <span>Sản phẩm: <strong>{selectedProducts.reduce((total, item) => total + item.quantity, 0)}</strong></span>
                <span>Tổng tạm tính: <strong>{formatCurrency(ticketTotal + productTotal)}</strong></span>
              </div>
              {result ? <span className="text-success">Đặt vé thành công · {result.bookingCode}</span> : null}
            </div>
            <div className="panel">
              <h2 className="h4">{data.showtime.movieTitle}</h2>
              <p className="muted">{data.seatMap.roomName ?? data.showtime.roomName} · {formatDateTime(data.showtime.startTime)} · {formatCurrency(data.showtime.basePrice)}</p>
              {!isBookable ? <ErrorMessage error={{ message: `Suất chiếu đang ở trạng thái ${formatLabel(data.showtime.status)}. Chỉ suất có trạng thái OPEN mới đặt được vé.` }} title="Suất chiếu chưa mở bán" /> : null}

              {step === 1 ? (
                <>
                  {missingSeatIds ? <ErrorMessage error={{ message: 'API sơ đồ ghế chưa trả về seatId.' }} title="Thiếu dữ liệu ghế" /> : null}
                  <p className="text-center rounded border bg-light py-2 mb-3">Màn hình</p>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {seats.map((seat) => {
                      const seatId = getSeatId(seat)
                      const selected = seatId !== null && selectedSeatIds.includes(seatId)
                      const available = isAvailable(seat)
                      return (
                        <button className={`btn btn-sm ${selected ? 'btn-danger' : available ? 'btn-outline-secondary' : 'btn-secondary'}`} disabled={!available || seatId === null} key={`${seat.seatRow}-${seat.seatNumber}`} onClick={() => toggleSeat(seat)} title={`${formatLabel(seat.seatType)} · ${formatLabel(seat.status)}`} type="button">
                          {seat.seatRow}{seat.seatNumber}
                        </button>
                      )
                    })}
                  </div>
                  <p className="muted mt-3">Đã chọn {selectedSeatIds.length} ghế.</p>
                  <button className="btn btn-danger" disabled={!selectedSeatIds.length || missingSeatIds} onClick={() => setStep(2)} type="button">Tiếp tục chọn sản phẩm</button>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  {productsLoading ? <p>Đang tải sản phẩm...</p> : null}
                  <ErrorMessage error={productsError} title="Không tải được sản phẩm" />
                  <div className="d-grid gap-2">
                    {products.map((product) => (
                      <div className="border rounded p-3 d-flex align-items-center justify-content-between gap-3" key={product.id}>
                        <div><strong>{product.name}</strong><div className="muted small">{formatCurrency(product.price)}</div></div>
                        <div className="btn-group">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(product.id, -1)} type="button">−</button>
                          <span className="btn btn-outline-secondary btn-sm disabled">{quantities[product.id] ?? 0}</span>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(product.id, 1)} type="button">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-2 mt-3"><button className="btn btn-outline-dark" onClick={() => setStep(1)} type="button">Quay lại</button><button className="btn btn-danger" onClick={() => setStep(3)} type="button">Tiếp tục xác nhận</button></div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <dl className="detail-list"><dt>Ghế</dt><dd>{selectedSeatIds.length}</dd><dt>Tiền vé</dt><dd>{formatCurrency(ticketTotal)}</dd><dt>Sản phẩm</dt><dd>{formatCurrency(productTotal)}</dd><dt>Tổng cộng</dt><dd>{formatCurrency(ticketTotal + productTotal)}</dd></dl>
                  <div className="d-flex gap-2"><button className="btn btn-outline-dark" onClick={() => setStep(2)} type="button">Quay lại</button><button className="btn btn-danger" disabled={submitting || !isBookable} onClick={handleSubmit} type="button">{submitting ? 'Đang tạo vé...' : 'Xác nhận đặt vé'}</button></div>
                </>
              ) : null}
              {error ? <div className="mt-3"><ErrorMessage error={error} title="Đặt vé thất bại" /></div> : null}
            </div>
          </div>
        ) : null}
      </DataState>
    </section>
  )
}

export default BookingFlowPage
