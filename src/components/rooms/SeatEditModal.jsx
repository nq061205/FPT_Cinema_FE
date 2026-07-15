import { useState } from "react";
import AppModal from "../common/AppModal.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import { formatLabel } from "../../lib/formatters.js";
import { seatService } from "../../services/seat.service.js";
import { SEAT_TYPES, SEAT_STATUSES } from "../../constants/enums.js";

const COLORS = { NORMAL: "#6c757d", VIP: "#c98512", COUPLE: "#d63384", PREMIUM: "#0d6efd" };
const seatColor = (type) => COLORS[type] ?? "#6c757d";
const seatOpacity = (status) => (status === "ACTIVE" ? 1 : status === "LOCKED" ? 0.45 : 0.25);

export default function SeatEditModal({ open, onClose, onSaved, seat, roomId }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await seatService.update(roomId, seat.id, {
        seatType: fd.get("seatType"),
        status: fd.get("status"),
      });
      await onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this seat?")) return;
    setError(null);
    setLoading(true);
    try {
      await seatService.remove(roomId, seat.id);
      await onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  if (!seat) return null;

  const label = `${seat.seatRow ?? "?"}${seat.seatNumber ?? "?"}`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      eyebrow="Edit seat"
      title={`Seat ${label}`}
      size="sm"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <button 
            className="btn btn-outline-danger btn-sm" 
            type="button" 
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          <button
            className="btn btn-danger btn-sm"
            form="seat-edit-form"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          </div>
        </div>
      }
    >
      {/* Seat preview chip */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            backgroundColor: seatColor(seat.seatType),
            opacity: seatOpacity(seat.status),
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          {label}
        </div>
      </div>

      <ErrorMessage error={error} />

      <form id="seat-edit-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-label">
            Seat type
            <select className="form-select" name="seatType" defaultValue={seat.seatType}>
              {SEAT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Status
            <select className="form-select" name="status" defaultValue={seat.status}>
              {SEAT_STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </AppModal>
  );
}
