import AppModal from "../common/AppModal.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import { formatLabel } from "../../lib/formatters.js";
import { SEAT_TYPES } from "../../constants/enums.js";


export default function RoomFormModal({ open, onClose, room, onSubmit, error }) {
  const isEdit = !!room;

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({ roomName: fd.get("roomName"), roomType: fd.get("roomType") });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      eyebrow="Room"
      title={isEdit ? `Edit — ${room.roomName}` : "Create New Room"}
      size="sm"
      footer={
        <>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" form="room-form" type="submit">
            {isEdit ? "Save changes" : "Create room"}
          </button>
        </>
      }
    >
      <ErrorMessage error={error} />
      <form id="room-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-label">
            Room name
            <input
              className="form-control"
              name="roomName"
              defaultValue={room?.roomName ?? ""}
              placeholder="e.g. Hall A"
              required
            />
          </label>
          <label className="form-label">
            Room type
            <select
              className="form-select"
              name="roomType"
              defaultValue={room?.roomType ?? "STANDARD"}
              required
            >
              {["STANDARD", "VIP", "IMAX", "PREMIUM"].map((t) => (
                <option key={t} value={t}>
                  {formatLabel(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </AppModal>
  );
}
