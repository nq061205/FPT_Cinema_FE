import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { showtimeService } from '../../services/showtime.service.js'
import { useAuth } from '../../hooks/useAuth.js'

const EMPTY_FORM = {
  movieId: '',
  roomId: '',
  startTime: '',
  basePrice: '',
  cleaningBufferMinutes: '15',
  batch: false,
  roomIds: '',
  startDate: '',
  endDate: '',
  dailyStartTimes: '09:00, 13:00, 18:00',
}

function ShowtimeManagementPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(['MANAGER'])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)
  const loadShowtimes = useCallback(async () => asArray(await showtimeService.list({ size: 100 })), [])
  const { data: showtimes, error, loading, execute } = useAsync(loadShowtimes, { initialData: [] })

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)
    try {
      const common = {
        movieId: Number(form.movieId),
        basePrice: Number(form.basePrice),
        cleaningBufferMinutes: Number(form.cleaningBufferMinutes || 0),
      }
      if (editingId) {
        await showtimeService.update(editingId, { ...common, roomId: Number(form.roomId), startTime: form.startTime })
      } else if (form.batch) {
        await showtimeService.createBatch({
          ...common,
          roomIds: form.roomIds.split(',').map((value) => Number(value.trim())).filter(Boolean),
          startDate: form.startDate,
          endDate: form.endDate,
          dailyStartTimes: form.dailyStartTimes.split(',').map((value) => value.trim()).filter(Boolean),
        })
      } else {
        await showtimeService.create({ ...common, roomId: Number(form.roomId), startTime: form.startTime })
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(showtime) {
    setEditingId(showtime.id)
    setForm({
      ...EMPTY_FORM,
      movieId: showtime.movieId ?? '',
      roomId: showtime.roomId ?? '',
      startTime: showtime.startTime ? String(showtime.startTime).slice(0, 16) : '',
      basePrice: showtime.basePrice ?? '',
      cleaningBufferMinutes: '15',
    })
    setActionError(null)
  }

  async function cancelShowtime(showtime) {
    if (!window.confirm(`Cancel showtime #${showtime.id}?`)) return
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
      <PageHeader eyebrow="Management" title="Showtimes" description="Create individual or batch schedules and cancel future showtimes." />
      {!canManage ? <div className="alert alert-info">Showtime mutations require the MANAGER role.</div> : null}
      <ErrorMessage error={actionError} />
      {canManage ? <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>{editingId ? `Edit showtime #${editingId}` : form.batch ? 'Create batch' : 'Create showtime'}</h2>
          {!editingId ? <label className="form-check"><input className="form-check-input" name="batch" type="checkbox" checked={form.batch} onChange={updateField} /><span className="form-check-label">Batch mode</span></label> : <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }}>Cancel</button>}
        </div>
        <div className="form-row">
          <label className="form-label">Movie ID<input className="form-control" name="movieId" type="number" min="1" value={form.movieId} onChange={updateField} required /></label>
          <label className="form-label">Base price<input className="form-control" name="basePrice" type="number" min="1" step="1000" value={form.basePrice} onChange={updateField} required /></label>
        </div>
        {form.batch ? (
          <>
            <label className="form-label">Room IDs (comma separated)<input className="form-control" name="roomIds" placeholder="1,2" value={form.roomIds} onChange={updateField} required /></label>
            <div className="form-row">
              <label className="form-label">Start date<input className="form-control" name="startDate" type="date" value={form.startDate} onChange={updateField} required /></label>
              <label className="form-label">End date<input className="form-control" name="endDate" type="date" value={form.endDate} onChange={updateField} required /></label>
            </div>
            <label className="form-label">Daily start times<input className="form-control" name="dailyStartTimes" placeholder="09:00, 13:00, 18:00" value={form.dailyStartTimes} onChange={updateField} required /></label>
          </>
        ) : (
          <div className="form-row">
            <label className="form-label">Room ID<input className="form-control" name="roomId" type="number" min="1" value={form.roomId} onChange={updateField} required /></label>
            <label className="form-label">Start time<input className="form-control" name="startTime" type="datetime-local" value={form.startTime} onChange={updateField} required /></label>
          </div>
        )}
        <label className="form-label">Cleaning buffer (minutes)<input className="form-control" name="cleaningBufferMinutes" type="number" min="0" value={form.cleaningBufferMinutes} onChange={updateField} /></label>
        <button className="btn btn-danger" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : form.batch ? 'Create batch' : 'Create showtime'}</button>
      </form> : null}

      <DataState data={showtimes} emptyTitle="No showtimes" emptyDescription="Create a schedule above." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle"><thead><tr><th>Movie</th><th>Room</th><th>Start</th><th>Status</th><th>Price</th><th /></tr></thead>
            <tbody>{showtimes.map((showtime) => <tr key={showtime.id}>
              <td>{showtime.movieTitle ?? showtime.movieId}</td><td>{showtime.roomName ?? showtime.roomId}</td><td>{formatDateTime(showtime.startTime)}</td><td><span className="status-pill">{formatLabel(showtime.status)}</span></td><td>{formatCurrency(showtime.basePrice)}</td>
              <td className="text-end"><div className="btn-group btn-group-sm">{canManage && ['OPEN', 'SOLD_OUT'].includes(String(showtime.status).toUpperCase()) ? <><button className="btn btn-outline-dark" type="button" onClick={() => startEdit(showtime)}>Edit</button><button className="btn btn-outline-danger" type="button" onClick={() => cancelShowtime(showtime)}>Cancel</button></> : null}</div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default ShowtimeManagementPage
