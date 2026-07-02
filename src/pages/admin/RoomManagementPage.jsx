import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { roomService } from '../../services/room.service.js'

function RoomManagementPage() {
  const [form, setForm] = useState({ roomName: '', roomType: '' })
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
      await roomService.create(form)
      setForm({ roomName: '', roomType: '' })
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
      <ErrorMessage error={actionError} />

      <form className="panel filter-bar" onSubmit={handleCreate}>
        <input className="form-control" name="roomName" placeholder="Room name" value={form.roomName} onChange={updateField} required />
        <input className="form-control" name="roomType" placeholder="Room type" value={form.roomType} onChange={updateField} required />
        <button className="btn btn-danger" type="submit">Create room</button>
      </form>

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
                      <button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'ACTIVE')}>Active</button>
                      <button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'MAINTENANCE')}>Maintenance</button>
                      <button className="btn btn-outline-dark" type="button" onClick={() => changeStatus(room, 'CLOSED')}>Closed</button>
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
