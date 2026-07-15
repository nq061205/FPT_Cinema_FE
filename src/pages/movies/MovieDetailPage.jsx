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
              {formatLabel(movie?.genre)} · {movie?.durationMinutes ?? '-'} phút · {movie?.ageRating ?? 'NR'}
            </p>
            <p>{movie?.description ?? 'Chưa có mô tả cho phim này.'}</p>
            <div className="page-actions">
              <Link className="btn btn-danger" to="/showtimes">Chọn suất chiếu</Link>
              {movie?.trailerUrl ? (
                <button className="btn btn-outline-dark" type="button" onClick={() => setShowTrailer(true)}>
                  ▶ Xem trailer
                </button>
              ) : null}
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
                    <th>Thời gian</th>
                    <th>Phòng</th>
                    <th className="text-end">Giá vé</th>
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
                          Chọn suất
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Chưa có suất chiếu" description="Suất chiếu cho phim này sẽ hiển thị ở đây khi có dữ liệu." />
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Đánh giá từ người xem</h2>
          </div>

          {reviews.length ? (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <div className="review-item__head">
                    <strong>{review.userName ?? review.fullName ?? 'Người dùng ẩn danh'}</strong>
                    {review.rating ? <span className="status-pill">{review.rating}/5 ★</span> : null}
                  </div>
                  <p>{review.comment ?? review.content}</p>
                  <small className="muted">{formatDateTime(review.createdAt)}</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có đánh giá" description="Bình luận của người xem sẽ hiển thị ở đây." />
          )}
        </section>
      </DataState>

      {showTrailer && movie ? <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} /> : null}
    </section>
  )
}

export default MovieDetailPage
