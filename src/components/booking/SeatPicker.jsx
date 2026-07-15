import { formatLabel } from '../../lib/formatters.js'

export function getSeatId(seat) {
  return seat.id ?? seat.seatId ?? null
}

export function isSeatAvailable(seat) {
  return String(seat.status).toUpperCase() === 'AVAILABLE'
}

function SeatPicker({ seats, selectedSeatIds, onToggle }) {
  return (
    <>
      <p className="text-center rounded border bg-light py-2 mb-3">Screen</p>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {seats.map((seat) => {
          const seatId = getSeatId(seat)
          const selected = seatId !== null && selectedSeatIds.includes(seatId)
          const available = isSeatAvailable(seat)
          return (
            <button
              className={`btn btn-sm ${selected ? 'btn-danger' : available ? 'btn-outline-secondary' : 'btn-secondary'}`}
              disabled={!available || seatId === null}
              key={`${seat.seatRow}-${seat.seatNumber}`}
              onClick={() => onToggle(seat)}
              title={`${formatLabel(seat.seatType)} · ${formatLabel(seat.status)}`}
              type="button"
            >
              {seat.seatRow}{seat.seatNumber}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default SeatPicker
