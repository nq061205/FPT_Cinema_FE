import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { SHOWTIME_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { showtimeService } from '../../services/showtime.service.js'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

function compactParams(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''))
}

function ShowtimeListPage() {
  const [filters, setFilters] = useState({ movieId: '', roomId: '', date: '', status: '', size: 20, branchId: '1', quick: false })
  const [submittedFilters, setSubmittedFilters] = useState(filters)
  const [seatMap, setSeatMap] = useState(null)
  const [seatMapError, setSeatMapError] = useState(null)
  const [seatMapLoading, setSeatMapLoading] = useState(false)
  const [compactShowtimes, setCompactShowtimes] = useState(null)
  const [compactLoading, setCompactLoading] = useState(false)
  const [compactError, setCompactError] = useState(null)

  const loadShowtimes = useCallback(async () => {
    const { branchId, quick, ...regularFilters } = submittedFilters
    const params = compactParams(regularFilters)
    return asArray(quick ? await showtimeService.quickList(branchId || 1, params) : await showtimeService.list(params))
  }, [submittedFilters])

  const { data: showtimes, error, loading } = useAsync(loadShowtimes, { initialData: [] })

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setFilters((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmittedFilters({ ...filters })
  }

  async function viewSeatMap(showtimeId) {
    setSeatMapError(null)
    setSeatMapLoading(true)
    try {
      setSeatMap(await showtimeService.seatMap(showtimeId))
    } catch (err) {
      setSeatMapError(err)
    } finally {
      setSeatMapLoading(false)
    }
  }

  async function loadCompactShowtimes() {
    setCompactError(null)
    setCompactLoading(true)
    try {
      setCompactShowtimes(asArray(await showtimeService.listCompact({ page: 0, size: 10 })))
    } catch (err) {
      setCompactError(err)
    } finally {
      setCompactLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Schedule" title="Showtimes" description="Search and inspect showtime availability." />

      <form className="filter-bar" onSubmit={handleSubmit}>
        <label className="form-label">
          Branch
          <input className="form-control" name="branchId" placeholder="Branch ID" value={filters.branchId} onChange={updateField} disabled={!filters.quick} />
        </label>
        <input className="form-control" name="movieId" placeholder="Movie ID" value={filters.movieId} onChange={updateField} />
        <input className="form-control" name="roomId" placeholder="Room ID" value={filters.roomId} onChange={updateField} />
        <input className="form-control" name="date" type="date" value={filters.date} onChange={updateField} />
        <select className="form-select" name="status" value={filters.status} onChange={updateField}>
          <option value="">All status</option>
          {SHOWTIME_STATUSES.map((status) => (
            <option key={status} value={status}>{formatLabel(status)}</option>
          ))}
        </select>
        <label className="form-check">
          <input className="form-check-input" name="quick" type="checkbox" checked={filters.quick} onChange={updateField} />
          <span className="form-check-label">Quick API</span>
        </label>
        <button className="btn btn-danger" type="submit">Filter</button>
      </form>
      <button className="btn btn-outline-dark align-self-start" type="button" onClick={loadCompactShowtimes} disabled={compactLoading}>{compactLoading ? 'Loading compact list...' : 'Load compact schedule API'}</button>
      {compactError ? <ErrorMessage error={compactError} title="Could not load compact schedule" /> : null}

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
                <th />
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
                  <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => viewSeatMap(showtime.id)}>{seatMapLoading ? '...' : 'Seats'}</button>{String(showtime.status).toUpperCase() === 'OPEN' ? <Link className="btn btn-outline-dark" to={`/booking?showtimeId=${showtime.id}`}>Book</Link> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
      {seatMapError ? <ErrorMessage error={seatMapError} title="Could not load seat map" /> : null}
      {seatMap ? <section className="panel"><div className="panel-header"><h2>Seat map · {seatMap.roomName ?? `Room ${seatMap.roomId}`}</h2><button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setSeatMap(null)}>Close</button></div><div className="d-flex flex-wrap gap-2">{asArray(seatMap.seats).map((seat) => <span className={`status-pill ${String(seat.status).toUpperCase() === 'AVAILABLE' ? '' : 'opacity-50'}`} key={`${seat.seatRow}-${seat.seatNumber}`}>{seat.seatRow}{seat.seatNumber} · {formatLabel(seat.status)}</span>)}</div></section> : null}
      {compactShowtimes ? <section className="panel"><div className="panel-header"><h2>Compact schedule response</h2><button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setCompactShowtimes(null)}>Close</button></div><div className="compact-list">{compactShowtimes.map((showtime, index) => <div className="compact-row" key={`${showtime.movieId}-${showtime.startTime}-${index}`}><span>{showtime.movieTitle ?? showtime.movieId} · {showtime.roomName ?? showtime.roomId}</span><small>{formatDateTime(showtime.startTime)} · {formatLabel(showtime.status)}</small></div>)}</div></section> : null}
    </section>
  )
}

export default ShowtimeListPage
