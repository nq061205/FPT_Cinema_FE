import { useState, useCallback, useEffect } from "react";
import AppModal from "../common/AppModal.jsx";
import DataState from "../common/DataState.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import { asArray } from "../../lib/collections.js";
import { formatLabel } from "../../lib/formatters.js";
import { useAsync } from "../../hooks/useAsync.js";
import { seatService } from "../../services/seat.service.js";
import { SEAT_TYPES, SEAT_STATUSES } from "../../constants/enums.js";
import SeatEditModal from "./SeatEditModal.jsx";
import GenerateSeatsModal from "./GenerateSeatsModal.jsx";

function groupByRow(list) {
  const map = {};
  for (const s of list) {
    const row = s.seatRow ?? "?";
    if (!map[row]) map[row] = [];
    map[row].push(s);
  }
  for (const row of Object.keys(map)) {
    map[row].sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0));
  }
  return map;
}

const COLORS = { NORMAL: "#6c757d", VIP: "#c98512", COUPLE: "#d63384", PREMIUM: "#0d6efd" };
const seatColor = (type) => COLORS[type] ?? "#6c757d";
const seatOpacity = (status) => (status === "ACTIVE" ? 1 : status === "LOCKED" ? 0.45 : 0.25);
const seatLabel = (s) => `${s.seatRow ?? "?"}${s.seatNumber ?? "?"}`;

export default function SeatLayoutModal({ open, onClose, room }) {
  const [actionError, setActionError] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());
  const [batchForm, setBatchForm] = useState({ seatType: "", status: "" });
  const [editingSeat, setEditingSeat] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const roomId = room?.id;

  const loadSeats = useCallback(async () => {
    if (!roomId) return [];
    return asArray(await seatService.getByRoom(roomId, { size: 200 }));
  }, [roomId]);

  const {
    data: seats,
    error: seatError,
    loading: seatLoading,
    execute: reloadSeats,
    setData: setSeats,
  } = useAsync(loadSeats, { initialData: [], immediate: false });

  useEffect(() => {
    if (open && roomId) {
      reloadSeats();
      setSelectedSeatIds(new Set());
      setBatchForm({ seatType: "", status: "" });
      setActionError(null);
    } else {
      setSeats([]);
    }
  }, [open, roomId, reloadSeats, setSeats]);

  const rowMap = groupByRow(seats);
  const sortedRows = Object.keys(rowMap).sort();

  async function handleBatchUpdate(e) {
    e.preventDefault();
    if (!selectedSeatIds.size) return;
    const payload = {};
    if (batchForm.seatType) payload.seatType = batchForm.seatType;
    if (batchForm.status) payload.status = batchForm.status;
    if (!payload.seatType && !payload.status) return;
    setActionError(null);
    try {
      await seatService.batchUpdate(roomId, { seatIds: [...selectedSeatIds], ...payload });
      setSelectedSeatIds(new Set());
      setBatchForm({ seatType: "", status: "" });
      await reloadSeats();
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleBatchDelete() {
    if (!selectedSeatIds.size) return;
    if (!window.confirm(`Delete ${selectedSeatIds.size} selected seats?`)) return;
    setActionError(null);
    try {
      await seatService.batchRemove(roomId, [...selectedSeatIds]);
      setSelectedSeatIds(new Set());
      setBatchForm({ seatType: "", status: "" });
      await reloadSeats();
    } catch (err) {
      setActionError(err);
    }
  }

  function toggleSeat(id) {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const modalFooter = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
      <span className="muted" style={{ flex: 1, fontSize: "0.82rem" }}>
        <strong>Click</strong> to edit &nbsp;|&nbsp; <strong>Right-click</strong> to multi-select
      </span>
      <button
        className="btn btn-outline-dark btn-sm"
        type="button"
        onClick={() => setShowGenerate(true)}
      >
        + Generate seats
      </button>
    </div>
  );

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        eyebrow="Seat Layout"
        title={room?.roomName ?? ""}
        size="wide"
        footer={modalFooter}
      >
        <ErrorMessage error={actionError ?? seatError} />

        {selectedSeatIds.size > 0 && (
          <form
            className="panel filter-bar"
            style={{ gridTemplateColumns: "auto 1fr 1fr auto auto auto" }}
            onSubmit={handleBatchUpdate}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 700, alignSelf: "center" }}>
              {selectedSeatIds.size} selected
            </span>
            <select
              className="form-select"
              value={batchForm.seatType}
              onChange={(e) => setBatchForm((c) => ({ ...c, seatType: e.target.value }))}
            >
              <option value="">-- Change type --</option>
              {SEAT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={batchForm.status}
              onChange={(e) => setBatchForm((c) => ({ ...c, status: e.target.value }))}
            >
              <option value="">-- Change status --</option>
              {SEAT_STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
            <button className="btn btn-dark btn-sm" type="submit">Apply</button>
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={() => {
                setSelectedSeatIds(new Set());
                setBatchForm({ seatType: "", status: "" });
              }}
            >
              Clear
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              type="button"
              title="Delete selected seats"
              onClick={handleBatchDelete}
            >
              Delete
            </button>
          </form>
        )}

        <DataState
          data={seats}
          emptyTitle="No seats yet"
          emptyDescription="Click Generate seats to create the seat layout."
          error={null}
          loading={seatLoading}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div className="screen-bar">Screen</div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={seats.length > 0 && selectedSeatIds.size === seats.length}
                onChange={() =>
                  setSelectedSeatIds(
                    selectedSeatIds.size === seats.length
                      ? new Set()
                      : new Set(seats.map((s) => s.id))
                  )
                }
              />
              Select all ({seats.length} seats)
            </label>

            <div className="seat-grid">
              {sortedRows.map((row) => (
                <div key={row} className="seat-row">
                  <span className="seat-row__label">{row}</span>
                  <div className="seat-row__seats">
                    {rowMap[row].map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        className={`seat-btn${selectedSeatIds.has(seat.id) ? " seat-btn--selected" : ""}`}
                        style={{
                          backgroundColor: seatColor(seat.seatType),
                          opacity: seatOpacity(seat.status),
                        }}
                        title={`${seatLabel(seat)} - ${seat.seatType} - ${seat.status}`}
                        onClick={() => setEditingSeat(seat)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleSeat(seat.id);
                        }}
                      >
                        {seat.seatNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="seat-legend">
              <strong style={{ color: "var(--ink)" }}>Types:</strong>
              {Object.entries(COLORS).map(([t, color]) => (
                <span key={t}>
                  <span className="seat-legend__dot" style={{ backgroundColor: color }} />
                  {t.toLowerCase()}
                </span>
              ))}
              <span style={{ margin: "0 4px" }}>|</span>
              <strong style={{ color: "var(--ink)" }}>Opacity:</strong>
              <span>active = 100%</span>
              <span>locked = 45%</span>
              <span>broken = 25%</span>
            </div>
          </div>
        </DataState>
      </AppModal>

      <SeatEditModal
        open={!!editingSeat}
        seat={editingSeat}
        roomId={roomId}
        onClose={() => setEditingSeat(null)}
        onSaved={async () => {
          setEditingSeat(null);
          await reloadSeats();
        }}
      />

      <GenerateSeatsModal
        open={showGenerate}
        roomId={roomId}
        onClose={() => setShowGenerate(false)}
        onSaved={async () => {
          setShowGenerate(false);
          await reloadSeats();
        }}
      />
    </>
  );
}
