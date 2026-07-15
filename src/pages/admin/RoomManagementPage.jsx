

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { roomService } from '../../services/room.service.js'
import { useAuth } from '../../hooks/useAuth.js'
import { ROOM_TYPES } from '../../constants/enums.js'

function RoomManagementPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(['MANAGER'])
  const [form, setForm] = useState({ roomName: '', roomType: '' })
  const [editingRoom, setEditingRoom] = useState(null)
  const [actionError, setActionError] = useState(null)
  const loadRooms = useCallback(async () => asArray(await roomService.list({ size: 50 })), [])
  const { data: rooms, error, loading, execute } = useAsync(loadRooms, { initialData: [] })

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setActionError(null)

    try {
      if (editingRoom) await roomService.update(editingRoom.id, form)
      else await roomService.create(form)
      setForm({ roomName: '', roomType: '' })
      setEditingRoom(null)
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  async function editRoom(room) {
    setActionError(null)
    try {
      const detail = await roomService.getById(room.id)
      setEditingRoom(detail)
      setForm({ roomName: detail.roomName ?? '', roomType: detail.roomType ?? '' })
    } catch (err) {
      setActionError(err)
    }
  }

  async function removeRoom(room) {
    if (!window.confirm(`Delete room ${room.roomName}?`)) return
    setActionError(null)
    try {
      await roomService.remove(room.id)
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  async function changeStatus(room, status) {
    setActionError(null)

    try {
      await roomService.updateStatus(room.id, status)
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Rooms" description="RoomController and SeatRoomController entry point." />
      {!canManage ? <div className="alert alert-info">Room mutations require the MANAGER role.</div> : null}
      <ErrorMessage error={actionError} />

      {canManage ? <form className="panel filter-bar" onSubmit={handleCreate}>
        <input className="form-control" name="roomName" placeholder="Room name" value={form.roomName} onChange={updateField} required />
        <select className="form-select" name="roomType" value={form.roomType} onChange={updateField} required><option value="">Room type</option>{ROOM_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select>
        <button className="btn btn-danger" type="submit">{editingRoom ? 'Save room' : 'Create room'}</button>
        {editingRoom ? <button className="btn btn-outline-dark" type="button" onClick={() => { setEditingRoom(null); setForm({ roomName: '', roomType: '' }) }}>Cancel</button> : null}
      </form> : null}

      <DataState data={rooms} emptyTitle="No rooms" emptyDescription="Create the first room to start scheduling." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.roomName}</td>
                  <td>{formatLabel(room.roomType)}</td>
                  <td><span className="status-pill">{formatLabel(room.status)}</span></td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Link className="btn btn-outline-dark" to={`/admin/rooms/${room.id}/seats`}>Seats</Link>
                      {canManage ? <><button className="btn btn-outline-dark" type="button" onClick={() => editRoom(room)}>Edit</button><button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'ACTIVE')}>Active</button><button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'MAINTENANCE')}>Maintenance</button><button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'CLOSED')}>Closed</button><button className="btn btn-outline-danger" type="button" onClick={() => removeRoom(room)}>Delete</button></> : null}
                    </div>
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

export default RoomManagementPage

