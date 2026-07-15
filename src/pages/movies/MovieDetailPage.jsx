import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import TrailerModal from '../../components/common/TrailerModal.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { showtimeService } from '../../services/showtime.service.js'
import { useAuth } from '../../hooks/useAuth.js'
import MovieReviewSection from '../../components/reviews/MovieReviewSection.jsx'

function movieStatus(movie) {
  if (movie?.status) return movie.status
  if (movie?.releaseDate && new Date(movie.releaseDate) <= new Date()) return 'NOW_SHOWING'
  return 'COMING_SOON'
}

function MovieDetailPage() {
  const { movieId } = useParams()
  const [showTrailer, setShowTrailer] = useState(false)

  const loadMovie = useCallback(async () => {
    const [movie, showtimes] = await Promise.all([
      movieService.getById(movieId),
      showtimeService.list({ movieId }),
    ]);

    return { movie, showtimes: asArray(showtimes) };
  }, [movieId]);

  const { data, error, loading } = useAsync(loadMovie, {
    initialData: { movie: null, showtimes: [] },
  });

  const { movie, showtimes } = data;

  return (
    <section className="page-stack">
      <DataState error={error} loading={loading}>
        <div className="movie-detail">
          <div className="movie-detail__poster">
            {movie?.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} />
            ) : (
              <div className="poster-fallback" />
            )}
          </div>

          <div className="movie-detail__info">
            <span className="eyebrow">{formatLabel(movieStatus(movie))}</span>
            <h1>{movie?.title}</h1>
            <p className="movie-detail__meta">
              {formatLabel(movie?.genre)} · {movie?.durationMinutes ?? '-'} phút · {movie?.ageRating ?? 'NR'}
            </p>
            <p>{movie?.description ?? 'Chưa có mô tả cho phim này.'}</p>
            <div className="page-actions">
              <Link className="btn btn-danger" to="/showtimes">
                Select Showtime
              </Link>
              {movie?.trailerUrl && (
                <button className="btn btn-outline-dark" onClick={() => setShowTrailer(true)}>
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Suất chiếu</h2>
          </div>

          {showtimes.length ? (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Room</th>
                    <th className="text-end">Giá vé</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {showtimes.map((showtime) => (
                    <tr key={showtime.id}>
                      <td>{formatDateTime(showtime.startTime)}</td>
                      <td>{showtime.roomName ?? `Phòng ${showtime.roomId}`}</td>
                      <td className="text-end">
                        {formatCurrency(showtime.basePrice)}
                      </td>
                      <td className="text-end">
                        <Link
                          className="btn btn-outline-dark btn-sm"
                          to={`/booking?showtimeId=${showtime.id}`}
                        >
                          select showtime
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (

           <EmptyState title="No showtimes available" description="Showtimes for this movie will appear here once scheduled." />
          )}
        </section>

        {/* Review & rating Component */}
        <MovieReviewSection movieId={movieId} />
      </DataState>

      {showTrailer && movie ? <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} /> : null}
    </section>
  );
}

export default MovieDetailPage;
