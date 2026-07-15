import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { SHOWTIME_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { roomService } from '../../services/room.service.js'
import { showtimeService } from '../../services/showtime.service.js'

function compactParams(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''))
}

const emptyForm = { movieId: '', roomId: '', startTime: '', basePrice: '' }

function ShowtimeManagementPage() {
  const [filters, setFilters] = useState({ movieId: '', roomId: '', date: '', status: '' })
  const loadShowtimes = useCallback(async () => asArray(await showtimeService.list(compactParams(filters))), [filters])
  const { data: showtimes, error, loading, execute } = useAsync(loadShowtimes, { initialData: [] })

  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies } = useAsync(loadMovies, { initialData: [] })

  const loadRooms = useCallback(async () => asArray(await roomService.list({ size: 50 })), [])
  const { data: rooms } = useAsync(loadRooms, { initialData: [] })

  const [form, setForm] = useState(emptyForm)
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function handleFilterSubmit(event) {
    event.preventDefault()
    execute().catch(() => {})
  }

  async function handleCreate(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)

    try {
      await showtimeService.create({
        movieId: Number(form.movieId),
        roomId: Number(form.roomId),
        startTime: form.startTime,
        basePrice: Number(form.basePrice),
      })
      setForm(emptyForm)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(showtime) {
    setActionError(null)

    try {
      await showtimeService.cancel(showtime.id)
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Showtime Management" description="Add new showtimes and assign them to screening rooms." />

      <ErrorMessage error={actionError} />

      <form className="panel form-grid" onSubmit={handleCreate}>
        <div className="panel-header">
          <h2>Create Showtime</h2>
        </div>

        <div className="form-row">
          <label className="form-label">
            Movie
            <select className="form-select" name="movieId" value={form.movieId} onChange={updateField} required>
              <option value="">Select movie</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>{movie.title}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Screening Room
            <select className="form-select" name="roomId" value={form.roomId} onChange={updateField} required>
              <option value="">Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.roomName}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            Start Time
            <input className="form-control" name="startTime" type="datetime-local" value={form.startTime} onChange={updateField} required />
          </label>
          <label className="form-label">
            Ticket Price
            <input className="form-control" name="basePrice" type="number" min="0" value={form.basePrice} onChange={updateField} required />
          </label>
        </div>

        <button className="btn btn-danger" disabled={saving} type="submit">
          {saving ? 'Creating...' : 'Create Showtime'}
        </button>
      </form>

      <form className="filter-bar" onSubmit={handleFilterSubmit}>
        <select className="form-select" name="movieId" value={filters.movieId} onChange={updateFilter}>
          <option value="">All movies</option>
          {movies.map((movie) => (
            <option key={movie.id} value={movie.id}>{movie.title}</option>
          ))}
        </select>
        <select className="form-select" name="roomId" value={filters.roomId} onChange={updateFilter}>
          <option value="">All rooms</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.roomName}</option>
          ))}
        </select>
        <input className="form-control" name="date" type="date" value={filters.date} onChange={updateFilter} />
        <select className="form-select" name="status" value={filters.status} onChange={updateFilter}>
          <option value="">All statuses</option>
          {SHOWTIME_STATUSES.map((status) => (
            <option key={status} value={status}>{formatLabel(status)}</option>
          ))}
        </select>
        <button className="btn btn-outline-dark" type="submit">Filter</button>
      </form>

      <DataState data={showtimes} emptyTitle="No showtimes found" emptyDescription="Create your first showtime above." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Room</th>
                <th>Time</th>
                <th>Status</th>
                <th className="text-end">Ticket Price</th>
                <th className="text-end">Actions</th>
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
                  <td className="text-end">
                    <button
                      className="btn btn-outline-dark btn-sm"
                      disabled={String(showtime.status).toUpperCase() === 'CANCELLED'}
                      onClick={() => handleCancel(showtime)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default ShowtimeManagementPage
