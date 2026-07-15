import { useCallback, useState, useEffect, useRef } from "react";
import DataState from "../../components/common/DataState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import AppModal from "../../components/common/AppModal.jsx";
import { asArray } from "../../lib/collections.js";
import { showtimeService } from "../../services/showtime.service.js";
import { roomService } from "../../services/room.service.js";
import { movieService } from "../../services/movie.service.js";
import { formatTime, parseDate } from "../../lib/formatters.js";


const START_HOUR = 8;
const END_HOUR = 24;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

export default function ShowtimeManagementPage() {
  const [date, setDate] = useState(() => {
    const d = new Date();

    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
  });
  
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMovieId, setFilterMovieId] = useState("");

  // Modal states
  const [actionError, setActionError] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  
  // Create / Edit modal state
  const [pendingDrop, setPendingDrop] = useState(null); 
  const [selectedShowtime, setSelectedShowtime] = useState(null); // for viewing/cancelling

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { size: 1000 };
      if (date) params.date = date;
      const [rRes, mRes, sRes] = await Promise.all([
        roomService.list({ size: 100 }),
        movieService.list(),
        showtimeService.list(params)
      ]);
      setRooms(asArray(rRes?.content ?? rRes).filter(r => r.status === "ACTIVE"));
      setMovies(asArray(mRes).filter(m => m.status !== "HIDDEN"));
      setShowtimes(asArray(sRes?.content ?? sRes));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleDragStart = (e, movie) => {
    e.dataTransfer.setData("application/json", JSON.stringify(movie));
  };

  const handleDragOver = (e, roomId) => {
    e.preventDefault(); // allow drop
    if (dragOverRoomId !== roomId) {
      setDragOverRoomId(roomId);
    }
  };

  const handleDragLeave = () => {
    setDragOverRoomId(null);
  };

  const handleDrop = (e, roomId) => {
    e.preventDefault();
    setDragOverRoomId(null);
    try {
      const movieData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (!movieData) return;
      
    
      const trackRect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - trackRect.left;
      const ratio = Math.max(0, Math.min(1, offsetX / trackRect.width));
      const droppedMinutes = ratio * TOTAL_MINUTES;
      const totalStartMinutes = START_HOUR * 60 + droppedMinutes;
      
 
      const snappedMinutes = Math.round(totalStartMinutes / 15) * 15;
      const hrs = Math.floor(snappedMinutes / 60);
      const mins = snappedMinutes % 60;
      
      const startTimeISO = `${date}T${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
      
      setPendingDrop({
        movie: movieData,
        roomId,
        startTime: startTimeISO,
        basePrice: 50000,
        cleaningBufferMinutes: 15
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    setActionError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await showtimeService.create({
        movieId: pendingDrop.movie.id,
        roomId: pendingDrop.roomId,
        startTime: fd.get("startTime"),
        basePrice: Number(fd.get("basePrice")),
        cleaningBufferMinutes: Number(fd.get("cleaningBufferMinutes"))
      });
      setPendingDrop(null);
      loadData();
    } catch (err) {
      setActionError(err);
    }
  };

  const handleCancelShowtime = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this showtime?")) return;
    setActionError(null);
    try {
      await showtimeService.cancel(id);
      setSelectedShowtime(null);
      loadData();
    } catch (err) {
      setActionError(err);
    }
  };
  // render ra cac khoi thoi gian
  const renderBlocks = (roomId) => {
    const roomShowtimes = showtimes.filter(s => String(s.roomId || s.room?.id) === String(roomId));
    
    return roomShowtimes.map(s => {
      const start = parseDate(s.startTime);
      const end = parseDate(s.endTime);
      
      const startMin = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
      const durationMin = (end.getTime() - start.getTime()) / 60000;
      
      const leftPct = Math.max(0, (startMin / TOTAL_MINUTES) * 100);
      const widthPct = Math.min(100 - leftPct, (durationMin / TOTAL_MINUTES) * 100);
      
      let className = "showtime-block";
      if (s.status === "FINISHED") className += " showtime-block--finished";
      if (s.status === "CANCELLED") className += " showtime-block--cancelled";
      if (filterMovieId && String(s.movieId) === String(filterMovieId)) {
        className += " showtime-block--highlight";
      }

      const m = movies.find(x => String(x.id) === String(s.movieId));
      const poster = m ? (m.posterUrl || m.poster || m.image) : "https://placehold.co/100x150?text=No+Image";
      
      return (
        <div
          key={s.id}
          className={className}
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, display: "flex", alignItems: "center", gap: 6, padding: "2px 8px" }}
          onClick={() => setSelectedShowtime({ ...s, poster })}
          title={`${s.movieTitle} - ${formatTime(s.startTime)} to ${formatTime(s.endTime)}`}
        >
          <img 
            src={poster} 
            alt={s.movieTitle} 
            onError={(e) => { e.currentTarget.src = "https://placehold.co/100x150?text=No+Image"; }}
            style={{ height: "calc(100% - 4px)", width: "auto", aspectRatio: "2/3", objectFit: "cover", borderRadius: 4, flexShrink: 0 }} 
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.movieTitle}</span>
        </div>
      );
    });
  };

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Manager"
        title="Showtime Schedule"
        description="Drag and drop movies to schedule showtimes."
      />

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        
        {/* Sidebar: Movies */}
        <div className="panel" style={{ width: 280, flexShrink: 0 }}>
          <h6 className="muted mb-3" style={{ fontWeight: 800 }}>AVAILABLE MOVIES</h6>
          <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            {movies.length === 0 && <div className="text-muted small">No movies found.</div>}
            {movies.map(m => (
              <div 
                key={m.id} 
                className="movie-draggable-item" 
                draggable 
                onDragStart={(e) => handleDragStart(e, m)}
                style={{ cursor: "grab", display: "flex", gap: 12, padding: 12, borderBottom: "1px solid var(--border)", backgroundColor: "transparent" }}
              >
                <img 
                  src={m.posterUrl || m.poster || m.image || "https://placehold.co/100x150?text=No+Image"} 
                  alt={m.title} 
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/100x150?text=No+Image"; }}
                  style={{ width: 40, height: 60, objectFit: "cover", borderRadius: 4, backgroundColor: "#f0f0f0" }} 
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>{m.title}</div>
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>{m.durationMinutes} mins</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Controls */}
          <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong style={{ fontSize: "0.9rem" }}>Schedule for:</strong>
                <input 
                  type="date" 
                  className="form-control form-control-sm" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong style={{ fontSize: "0.9rem" }}>Filter Movie:</strong>
                <select 
                  className="form-select form-select-sm" 
                  style={{ minWidth: 200 }}
                  value={filterMovieId}
                  onChange={e => setFilterMovieId(e.target.value)}
                >
                  <option value="">All Movies</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              Time window: 08:00 - 24:00
            </div>
          </div>

          <DataState data={rooms} loading={loading} error={error} emptyTitle="No active rooms">
            <div className={`timeline-board ${filterMovieId ? "timeline-board--filtered" : ""}`}>
              <div className="timeline-header">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="timeline-time-slot">
                    {String(START_HOUR + i * 2).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {rooms.map((room) => (
                <div key={room.id} className="timeline-row">
                  <div className="timeline-room-label">
                    {room.roomName}
                  </div>
                  <div 
                    className={`timeline-track ${dragOverRoomId === room.id ? "timeline-track--drag-over" : ""}`}
                    onDragOver={(e) => handleDragOver(e, room.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, room.id)}
                  >
                    {renderBlocks(room.id)}
                  </div>
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </div>

      {/* tao showtime popup */}
      <AppModal
        open={!!pendingDrop}
        onClose={() => { setPendingDrop(null); setActionError(null); }}
        title="Create Showtime"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setPendingDrop(null)}>Cancel</button>
            <button className="btn btn-dark btn-sm" type="submit" form="create-showtime-form">Create</button>
          </>
        }
      >
        <ErrorMessage error={actionError} />
        {pendingDrop && (
          <form id="create-showtime-form" onSubmit={handleCreateShowtime}>
            <div className="form-grid">
              <label className="form-label">
                Movie
                <input className="form-control" readOnly value={pendingDrop.movie.title} />
              </label>
              <label className="form-label">
                Room
                <input className="form-control" readOnly value={rooms.find(r => r.id === pendingDrop.roomId)?.roomName || ""} />
              </label>
              <label className="form-label">
                Start Time
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  name="startTime" 
                  defaultValue={pendingDrop.startTime}
                  required 
                />
              </label>
              <label className="form-label">
                Base Price (VND)
                <input 
                  type="number" 
                  className="form-control" 
                  name="basePrice" 
                  defaultValue={pendingDrop.basePrice} 
                  required 
                />
              </label>
              <label className="form-label">
                Cleaning Buffer (Mins)
                <input 
                  type="number" 
                  className="form-control" 
                  name="cleaningBufferMinutes" 
                  defaultValue={pendingDrop.cleaningBufferMinutes} 
                  required 
                />
              </label>
            </div>
          </form>
        )}
      </AppModal>

      {/* view showtime*/}
      <AppModal
        open={!!selectedShowtime}
        onClose={() => { setSelectedShowtime(null); setActionError(null); }}
        title="Showtime Details"
        size="sm"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {selectedShowtime?.status === "OPEN" || selectedShowtime?.status === "SCHEDULED" ? (
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={() => handleCancelShowtime(selectedShowtime.id)}
              >
                Cancel Showtime
              </button>
            ) : (
              <div />
            )}
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedShowtime(null)}>Close</button>
          </div>
        }
      >
        <ErrorMessage error={actionError} />
        {selectedShowtime && (
          <div style={{ display: "flex", gap: 16 }}>
            <img 
              src={selectedShowtime.poster || "https://placehold.co/100x150?text=No+Image"} 
              alt={selectedShowtime.movieTitle} 
              onError={(e) => { e.currentTarget.src = "https://placehold.co/100x150?text=No+Image"; }}
              style={{ width: 100, height: 150, objectFit: "cover", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                 <div className="muted small" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px" }}>Movie</div>
                 <div style={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2 }}>{selectedShowtime.movieTitle}</div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                   <div className="muted small" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px" }}>Room</div>
                   <div style={{ fontWeight: 600 }}>{selectedShowtime.roomName || `Room #${selectedShowtime.roomId}`}</div>
                </div>
                <div>
                   <div className="muted small" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px" }}>Status</div>
                   <div><span className="badge">{selectedShowtime.status}</span></div>
                </div>
              </div>
              <div>
                 <div className="muted small" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "1px" }}>Time</div>
                 <div style={{ fontWeight: 600 }}>{formatTime(selectedShowtime.startTime)} - {formatTime(selectedShowtime.endTime)}</div>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </section>
  );
}
