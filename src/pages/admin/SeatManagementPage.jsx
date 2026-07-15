import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { SEAT_STATUSES, SEAT_TYPES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { seatService } from '../../services/seat.service.js'
import { useAuth } from '../../hooks/useAuth.js'

function SeatManagementPage() {
  const { roomId } = useParams()
  const { hasRole } = useAuth()
  const canManage = hasRole(['MANAGER'])
  const [selected, setSelected] = useState([])
  const [editingSeat, setEditingSeat] = useState(null)
  const [seatDetail, setSeatDetail] = useState(null)
  const [seatType, setSeatType] = useState('NORMAL')
  const [status, setStatus] = useState('ACTIVE')
  const [generateForm, setGenerateForm] = useState({ rows: 5, seatsPerRow: 10, seatType: 'NORMAL' })
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)
  const loadSeats = useCallback(async () => asArray(await seatService.getByRoom(roomId, { size: 500, sort: 'seatRow,seatNumber' })), [roomId])
  const { data: seats, error, loading, execute } = useAsync(loadSeats, { initialData: [] })
  const allSelected = useMemo(() => seats.length > 0 && selected.length === seats.length, [seats.length, selected.length])

  function toggleSeat(id) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  function toggleAll() {
    setSelected(allSelected ? [] : seats.map((seat) => seat.id))
  }

  async function applyBatch(event) {
    event.preventDefault()
    if (!selected.length) return
    setActionError(null)
    setSaving(true)
    try {
      await seatService.batchUpdate(roomId, { seatIds: selected, seatType, status })
      setSelected([])
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  async function generateSeats(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)
    try {
      await seatService.generate(roomId, { ...generateForm, rows: Number(generateForm.rows), seatsPerRow: Number(generateForm.seatsPerRow) })
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  async function openSeat(seat) {
    setActionError(null)
    try {
      setEditingSeat(seat)
      setSeatDetail(await seatService.detail({ seatId: seat.id }))
    } catch (err) {
      setActionError(err)
    }
  }

  async function updateSeat(event) {
    event.preventDefault()
    if (!editingSeat) return
    setActionError(null)
    setSaving(true)
    try {
      await seatService.update(roomId, editingSeat.id, { seatType: seatDetail.seatType, status: seatDetail.status })
      setEditingSeat(null)
      setSeatDetail(null)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  function updateGenerateField(event) {
    setGenerateForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title={`Room ${roomId} seats`} description="Generate seats and update one or many seat records." actions={<Link className="btn btn-outline-dark" to="/admin/rooms">Back to rooms</Link>} />
      {!canManage ? <div className="alert alert-info">Seat mutations require the MANAGER role.</div> : null}
      <ErrorMessage error={actionError} />

      <div className="grid-two">
        {canManage ? <form className="panel form-grid" onSubmit={generateSeats}>
          <h2>Generate seats</h2>
          <div className="form-row"><label className="form-label">Rows<input className="form-control" name="rows" type="number" min="1" value={generateForm.rows} onChange={updateGenerateField} /></label><label className="form-label">Seats per row<input className="form-control" name="seatsPerRow" type="number" min="1" value={generateForm.seatsPerRow} onChange={updateGenerateField} /></label></div>
          <label className="form-label">Seat type<select className="form-select" name="seatType" value={generateForm.seatType} onChange={updateGenerateField}>{SEAT_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select></label>
          <button className="btn btn-danger" type="submit" disabled={saving}>Generate</button>
        </form> : <div className="panel"><p className="muted">Seat generation is unavailable for this role.</p></div>}
        {canManage ? <form className="panel form-grid" onSubmit={applyBatch}>
          <h2>Batch update ({selected.length})</h2>
          <div className="form-row"><label className="form-label">Seat type<select className="form-select" value={seatType} onChange={(event) => setSeatType(event.target.value)}>{SEAT_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select></label><label className="form-label">Status<select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>{SEAT_STATUSES.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></label></div>
          <button className="btn btn-outline-dark" type="submit" disabled={saving || !selected.length}>Apply to selected</button>
        </form> : <div className="panel"><p className="muted">Batch seat updates are unavailable for this role.</p></div>}
      </div>

      {canManage && editingSeat && seatDetail ? <form className="panel form-row align-items-end" onSubmit={updateSeat}>
        <div><strong>Edit {editingSeat.seatRow}{editingSeat.seatNumber}</strong></div>
        <label className="form-label">Type<select className="form-select" value={seatDetail.seatType ?? ''} onChange={(event) => setSeatDetail((current) => ({ ...current, seatType: event.target.value }))}>{SEAT_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select></label>
        <label className="form-label">Status<select className="form-select" value={seatDetail.status ?? ''} onChange={(event) => setSeatDetail((current) => ({ ...current, status: event.target.value }))}>{SEAT_STATUSES.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></label>
        <button className="btn btn-danger" type="submit" disabled={saving}>Save seat</button>
        <button className="btn btn-outline-dark" type="button" onClick={() => { setEditingSeat(null); setSeatDetail(null) }}>Cancel</button>
      </form> : null}

      <DataState data={seats} emptyTitle="No seats" emptyDescription="Generate seats for this room." error={error} loading={loading}>
        <div className="panel table-responsive"><table className="table align-middle"><thead><tr><th>{canManage ? <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all seats" /> : null}</th><th>Seat</th><th>Type</th><th>Status</th><th /></tr></thead><tbody>{seats.map((seat) => <tr key={seat.id}><td>{canManage ? <input type="checkbox" checked={selected.includes(seat.id)} onChange={() => toggleSeat(seat.id)} aria-label={`Select ${seat.seatRow}${seat.seatNumber}`} /> : null}</td><td>{seat.seatRow}{seat.seatNumber}</td><td>{formatLabel(seat.seatType)}</td><td><span className="status-pill">{formatLabel(seat.status)}</span></td><td className="text-end">{canManage ? <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => openSeat(seat)}>Detail / edit</button> : null}</td></tr>)}</tbody></table></div>
      </DataState>
    </section>
  )
}

export default SeatManagementPage
