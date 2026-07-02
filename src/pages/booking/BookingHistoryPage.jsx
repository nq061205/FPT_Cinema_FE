import { useCallback } from 'react'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { bookingService } from '../../services/booking.service.js'

function BookingHistoryPage() {
  const loadBookings = useCallback(async () => asArray(await bookingService.history({ page: 0, size: 20 })), [])
  const { data: bookings, error, loading } = useAsync(loadBookings, { initialData: [] })

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Account" title="My tickets" description="Authenticated booking history from /api/booking/list." />

      <DataState
        data={bookings}
        emptyTitle="No bookings"
        emptyDescription="Completed bookings will appear here."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Movie</th>
                <th>Start</th>
                <th>Status</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.bookingCode}>
                  <td>{booking.bookingCode}</td>
                  <td>{booking.movieTitle}</td>
                  <td>{formatDateTime(booking.startTime)}</td>
                  <td><span className="status-pill">{formatLabel(booking.status)}</span></td>
                  <td className="text-end">{formatCurrency(booking.finalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default BookingHistoryPage
