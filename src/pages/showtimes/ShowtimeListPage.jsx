import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { SHOWTIME_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { showtimeService } from '../../services/showtime.service.js'

function compactParams(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''))
}

function ShowtimeListPage() {
  const [filters, setFilters] = useState({ movieId: '', roomId: '', date: '', status: '', size: 20 })

  const loadShowtimes = useCallback(async () => {
    return asArray(await showtimeService.list(compactParams(filters)))
  }, [filters])

  const { data: showtimes, error, loading, execute } = useAsync(loadShowtimes, { initialData: [] })

  function updateField(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    execute().catch(() => {})
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Schedule" title="Showtimes" description="Search and inspect showtime availability." />

      <form className="filter-bar" onSubmit={handleSubmit}>
        <input className="form-control" name="movieId" placeholder="Movie ID" value={filters.movieId} onChange={updateField} />
        <input className="form-control" name="roomId" placeholder="Room ID" value={filters.roomId} onChange={updateField} />
        <input className="form-control" name="date" type="date" value={filters.date} onChange={updateField} />
        <select className="form-select" name="status" value={filters.status} onChange={updateField}>
          <option value="">All status</option>
          {SHOWTIME_STATUSES.map((status) => (
            <option key={status} value={status}>{formatLabel(status)}</option>
          ))}
        </select>
        <button className="btn btn-danger" type="submit">Filter</button>
      </form>

      <DataState
        data={showtimes}
        emptyTitle="No showtimes"
        emptyDescription="Try different filters or create showtimes from admin."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Room</th>
                <th>Start</th>
                <th>Status</th>
                <th className="text-end">Base price</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.map((showtime) => (
                <tr key={showtime.id}>
                  <td>{showtime.movieTitle ?? showtime.movieId}</td>
                  <td>{showtime.roomName ?? showtime.roomId}</td>
                  <td>{formatDateTime(showtime.startTime)}</td>
                  <td><span className="status-pill">{formatLabel(showtime.status)}</span></td>
                  <td className="text-end">{formatCurrency(showtime.basePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default ShowtimeListPage
