import { useState } from "react";
import AppModal from "../common/AppModal.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import { formatLabel } from "../../lib/formatters.js";
import { seatService } from "../../services/seat.service.js";
import { SEAT_TYPES } from "../../constants/enums.js";

export default function GenerateSeatsModal({ open, onClose, onSaved, roomId }) {
  const [form, setForm] = useState({ rows: "5", seatsPerRow: "10", seatType: "NORMAL" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const rows = parseInt(form.rows, 10);
    const seatsPerRow = parseInt(form.seatsPerRow, 10);
    if (!rows || rows < 1 || !seatsPerRow || seatsPerRow < 1) return;
    setError(null);
    setLoading(true);
    try {
      await seatService.generateSeats(roomId, { rows, seatsPerRow, seatType: form.seatType });
      setForm({ rows: "5", seatsPerRow: "10", seatType: "NORMAL" });
      await onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      eyebrow="Seat generation"
      title="Generate seats"
      size="sm"
      footer={
        <>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            form="generate-seats-form"
            type="submit"
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </>
      }
    >
      <ErrorMessage error={error} />

      {(() => {
        const r = parseInt(form.rows, 10) || 0;
        const s = parseInt(form.seatsPerRow, 10) || 0;
        return r > 0 && s > 0 ? (
          <div
            className="panel"
            style={{ background: "var(--surface-muted)", textAlign: "center", padding: "12px" }}
          >
            <strong style={{ fontSize: "1.4rem" }}>{r * s}</strong>
            <p style={{ margin: 0, fontSize: "0.82rem" }}>
              seats will be generated ({r} rows × {s} per row)
            </p>
          </div>
        ) : null;
      })()}

      <form id="generate-seats-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-label">
            Number of rows
            <input
              className="form-control"
              type="number"
              min={1}
              max={26}
              value={form.rows}
              onChange={(e) => updateField("rows", e.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Seats per row
            <input
              className="form-control"
              type="number"
              min={1}
              max={50}
              value={form.seatsPerRow}
              onChange={(e) => updateField("seatsPerRow", e.target.value)}
              required
            />
          </label>
          <label className="form-label" style={{ gridColumn: "1 / -1" }}>
            Default seat type
            <select
              className="form-select"
              value={form.seatType}
              onChange={(e) => updateField("seatType", e.target.value)}
            >
              {SEAT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </AppModal>
  );
}
