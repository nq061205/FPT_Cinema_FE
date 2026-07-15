import { useCallback, useState } from "react";
import DataState from "../../components/common/DataState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import RoomFormModal from "../../components/rooms/RoomFormModal.jsx";
import SeatLayoutModal from "../../components/rooms/SeatLayoutModal.jsx";
import { asArray } from "../../lib/collections.js";
import { formatLabel } from "../../lib/formatters.js";
import { useAsync } from "../../hooks/useAsync.js";
import { roomService } from "../../services/room.service.js";

export default function RoomManagementPage() {
  const [actionError, setActionError] = useState(null);

  
  const [formModal, setFormModal] = useState({ open: false, room: null }); 
  const [seatModal, setSeatModal] = useState({ open: false, room: null }); 

  
  const loadRooms = useCallback(
    async () => asArray(await roomService.list({ size: 50 })),
    [],
  );
  const { data: rooms, error, loading, execute } = useAsync(loadRooms, { initialData: [] });

 
  function openCreate() {
    setFormModal({ open: true, room: null });
    setActionError(null);
  }

  function openEdit(room) {
    setFormModal({ open: true, room });
    setActionError(null);
  }

  function closeForm() {
    setFormModal({ open: false, room: null });
  }

  
  async function handleFormSubmit(formData) {
    setActionError(null);
    try {
      if (formModal.room) {
        await roomService.update(formModal.room.id, formData);
      } else {
        await roomService.create(formData);
      }
      closeForm();
      await execute();
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleDelete(room) {
    if (!window.confirm(`Delete room "${room.roomName}"?`)) return;
    setActionError(null);
    try {
      await roomService.remove(room.id);
      await execute();
    } catch (err) {
      setActionError(err);
    }
  }

  async function changeStatus(room, status) {
    setActionError(null);
    try {
      await roomService.updateStatus(room.id, status);
      await execute();
    } catch (err) {
      setActionError(err);
    }
  }

  
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Management"
        title="Rooms & Seats"
        description="Create rooms and manage their seat layouts."
        actions={
          <button className="btn btn-danger btn-sm" type="button" onClick={openCreate}>
            + New room
          </button>
        }
      />

      <ErrorMessage error={actionError} />

      <DataState
        data={rooms}
        emptyTitle="No rooms yet"
        emptyDescription="Create the first room to start scheduling."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Seats</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <strong>{room.roomName}</strong>
                  </td>
                  <td>{formatLabel(room.roomType)}</td>
                  <td>
                    <span className="status-pill" style={{ background: "rgba(30,27,24,0.06)", color: "var(--ink)", borderColor: "var(--border)" }}>
                      {room.seatCount ?? 0} seats
                    </span>
                  </td>
                  <td>
                    <span className="status-pill">{formatLabel(room.status)}</span>
                  </td>
                  <td className="text-end">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                     
                      <button
                        className="btn btn-dark btn-sm"
                        type="button"
                        onClick={() => setSeatModal({ open: true, room })}
                      >
                        Seats
                      </button>

                
                      <button
                        className="btn btn-outline-dark btn-sm"
                        type="button"
                        onClick={() => openEdit(room)}
                      >
                        Edit
                      </button>

           
                      <button
                        className="btn btn-outline-danger btn-sm"
                        type="button"
                        onClick={() => handleDelete(room)}
                      >
                        Delete
                      </button>

                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-dark"
                          type="button"
                          onClick={() => changeStatus(room, "ACTIVE")}
                        >
                          Active
                        </button>
                        <button
                          className="btn btn-outline-dark"
                          type="button"
                          onClick={() => changeStatus(room, "MAINTENANCE")}
                        >
                          Maintenance
                        </button>
                        <button
                          className="btn btn-outline-dark"
                          type="button"
                          onClick={() => changeStatus(room, "CLOSED")}
                        >
                          Closed
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      <RoomFormModal
        open={formModal.open}
        room={formModal.room}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        error={actionError}
      />

      <SeatLayoutModal
        open={seatModal.open}
        room={seatModal.room}
        onClose={() => setSeatModal({ open: false, room: null })}
      />
    </section>
  );
}
