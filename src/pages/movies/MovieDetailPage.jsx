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
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'

function movieStatus(movie) {
  if (movie?.status) return movie.status
  if (movie?.releaseDate && new Date(movie.releaseDate) <= new Date()) return 'NOW_SHOWING'
  return 'COMING_SOON'
}

function MovieDetailPage() {
  const { movieId } = useParams()
  const { isAuthenticated } = useAuth()
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: '5', comment: '' })
  const [reviewError, setReviewError] = useState(null)
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [editReviewForm, setEditReviewForm] = useState({ reviewId: '', rating: '5', comment: '' })
  const [editReviewError, setEditReviewError] = useState(null)
  const [editReviewMessage, setEditReviewMessage] = useState('')
  const [editReviewSubmitting, setEditReviewSubmitting] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)

  const loadMovie = useCallback(async () => {
    const [movie, showtimes, reviews] = await Promise.all([
      movieService.getById(movieId),
      showtimeService.list({ movieId }),
      reviewService.listByMovie(movieId),
    ])

    return { movie, showtimes: asArray(showtimes), reviews: asArray(reviews) }
  }, [movieId])

  const { data, error, loading, execute } = useAsync(loadMovie, {
    initialData: { movie: null, showtimes: [], reviews: [] },
  })

  const { movie, showtimes, reviews } = data

  function updateReviewField(event) {
    setReviewForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitReview(event) {
    event.preventDefault()
    setReviewError(null)
    setReviewMessage('')
    setReviewSubmitting(true)

    try {
      await reviewService.create({
        movieId: Number(movieId),
        bookingId: Number(reviewForm.bookingId),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      })
      setReviewForm({ bookingId: '', rating: '5', comment: '' })
      setReviewMessage('Review submitted.')
      await execute()
    } catch (err) {
      setReviewError(err)
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function updateReview(event) {
    event.preventDefault()
    setEditReviewError(null)
    setEditReviewMessage('')
    setEditReviewSubmitting(true)
    try {
      await reviewService.update(Number(editReviewForm.reviewId), {
        rating: Number(editReviewForm.rating),
        comment: editReviewForm.comment.trim(),
      })
      setEditReviewMessage('Review updated.')
      await execute()
    } catch (err) {
      setEditReviewError(err)
    } finally {
      setEditReviewSubmitting(false)
    }
  }

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
                    <strong>{review.maskedName ?? review.userName ?? review.fullName ?? 'Người dùng ẩn danh'}</strong>
                    {review.rating ? <span className="status-pill">{review.rating}/5 ★</span> : null}
                  </div>
                  <p>{review.comment ?? review.content}</p>
                  <small className="muted">{formatDateTime(review.createdAt)}{review.id ? ` · Review #${review.id}` : ''}</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" description="Viewer comments will appear here." />
          )}
        </section>

        {isAuthenticated ? (
          <>
          <section className="panel">
            <div className="panel-header">
              <h2>Write a review</h2>
              <span className="muted small">Use the numeric booking ID for this movie.</span>
            </div>
            <form className="form-grid" onSubmit={submitReview}>
              <div className="form-row">
                <label className="form-label">
                  Booking ID
                  <input
                    className="form-control"
                    name="bookingId"
                    type="number"
                    min="1"
                    value={reviewForm.bookingId}
                    onChange={updateReviewField}
                    required
                  />
                </label>
                <label className="form-label">
                  Rating
                  <select className="form-select" name="rating" value={reviewForm.rating} onChange={updateReviewField}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                  </select>
                </label>
              </div>
              <label className="form-label">
                Comment
                <textarea className="form-control" name="comment" rows="3" maxLength="1000" value={reviewForm.comment} onChange={updateReviewField} required />
              </label>
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-danger" type="submit" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit review'}
                </button>
                {reviewMessage ? <span className="text-success">{reviewMessage}</span> : null}
              </div>
              <ErrorMessage error={reviewError} title="Review failed" />
            </form>
          </section>
          <section className="panel">
            <div className="panel-header"><h2>Edit your review</h2><span className="muted small">Requires the review ID returned by the API.</span></div>
            <form className="form-grid" onSubmit={updateReview}>
              <div className="form-row"><label className="form-label">Review ID<input className="form-control" type="number" min="1" value={editReviewForm.reviewId} onChange={(event) => setEditReviewForm((current) => ({ ...current, reviewId: event.target.value }))} required /></label><label className="form-label">Rating<select className="form-select" value={editReviewForm.rating} onChange={(event) => setEditReviewForm((current) => ({ ...current, rating: event.target.value }))}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}</select></label></div>
              <textarea className="form-control" rows="3" value={editReviewForm.comment} onChange={(event) => setEditReviewForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Updated comment" required />
              <div className="d-flex align-items-center gap-3"><button className="btn btn-outline-dark" type="submit" disabled={editReviewSubmitting}>{editReviewSubmitting ? 'Updating...' : 'Update review'}</button>{editReviewMessage ? <span className="text-success">{editReviewMessage}</span> : null}</div>
              <ErrorMessage error={editReviewError} title="Update review failed" />
            </form>
          </section>
          </>
        ) : (
          <p className="muted">Sign in to write a review.</p>
        )}
      </DataState>

      {showTrailer && movie ? <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} /> : null}
    </section>
  )
}

export default MovieDetailPage