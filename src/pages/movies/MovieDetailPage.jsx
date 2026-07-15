import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import TrailerModal from '../../components/common/TrailerModal.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { reviewService } from '../../services/review.service.js'
import { showtimeService } from '../../services/showtime.service.js'

function MovieDetailPage() {
  const { movieId } = useParams()
  const [showTrailer, setShowTrailer] = useState(false)

  const loadMovie = useCallback(async () => {
    const [movie, showtimes, reviews] = await Promise.all([
      movieService.getById(movieId),
      showtimeService.list({ movieId }),
      reviewService.listByMovie(movieId),
    ])

    return { movie, showtimes: asArray(showtimes), reviews: asArray(reviews) }
  }, [movieId])

  const { data, error, loading } = useAsync(loadMovie, {
    initialData: { movie: null, showtimes: [], reviews: [] },
  })

  const { movie, showtimes, reviews } = data

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
            <span className="eyebrow">{formatLabel(movie?.status)}</span>
            <h1>{movie?.title}</h1>
            <p className="movie-detail__meta">
              {formatLabel(movie?.genre)} · {movie?.durationMinutes ?? '-'} mins · {movie?.ageRating ?? 'NR'}
            </p>
            <p>{movie?.description ?? 'No description available for this movie.'}</p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Showtimes</h2>
          </div>

          {showtimes.length ? (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Room</th>
                    <th className="text-end">Ticket Price</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {showtimes.map((showtime) => (
                    <tr key={showtime.id}>
                      <td>{formatDateTime(showtime.startTime)}</td>
                      <td>{showtime.roomName ?? `Phòng ${showtime.roomId}`}</td>
                      <td className="text-end">{formatCurrency(showtime.basePrice)}</td>
                      <td className="text-end">
                        <Link className="btn btn-outline-dark btn-sm" to={`/booking?showtimeId=${showtime.id}`}>
                          Select
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

        <section className="panel">
          <div className="panel-header">
            <h2>Reviews</h2>
          </div>

          {reviews.length ? (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <div className="review-item__head">
                    <strong>{review.userName ?? review.fullName ?? 'Anonymous User'}</strong>
                    {review.rating ? <span className="status-pill">{review.rating}/5 ★</span> : null}
                  </div>
                  <p>{review.comment ?? review.content}</p>
                  <small className="muted">{formatDateTime(review.createdAt)}</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" description="Viewer comments will appear here." />
          )}
        </section>
      </DataState>

      {showTrailer && movie ? <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} /> : null}
    </section>
  )
}

export default MovieDetailPage
