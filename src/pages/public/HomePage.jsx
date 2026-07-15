import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import TrailerModal from '../../components/common/TrailerModal.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { useAuth } from '../../hooks/useAuth.js'
import { reviewService } from '../../services/review.service.js'

const EMPTY_MOVIES = []

function MovieRow({ movies }) {
  if (!movies.length) {
    return <EmptyState title="No movies found" description="New movies will appear here when available." />
  }

  return (
    <div className="movie-row">
      {movies.map((movie) => (
        <div className="movie-poster-card" key={movie.id ?? movie.title}>
          <Link className="movie-poster-card__media" to={`/movies/${movie.id}`}>
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
            ) : (
              <div className="poster-fallback" />
            )}
          </Link>
          <div className="movie-poster-card__body">
            <h3>{movie.title}</h3>
            <p>{formatLabel(movie.genre)} · {movie.durationMinutes ?? '-'} mins</p>
            <Link className="btn btn-danger btn-sm movie-poster-card__cta" to={`/movies/${movie.id}`}>
              Book tickets
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function SpotlightCarousel({ movies, onPlayTrailer }) {
  const [index, setIndex] = useState(0)
  const total = movies.length

  if (!total) {
    return (
      <section className="hero-banner">
        <div className="hero-banner__content">
          <span className="eyebrow">Now Showing</span>
          <h1>Fast Movie Ticket Booking</h1>
          <p>Discover movies now showing, latest schedules, and book tickets in just a few steps.</p>
          <div className="page-actions">
            <Link className="btn btn-danger" to="/movies">Book Now</Link>
          </div>
        </div>
      </section>
    )
  }

  const at = (offset) => movies[(index + offset + total) % total]
  const current = at(0)
  const prevMovie = at(-1)
  const nextMovie = at(1)
  const showSides = total > 1

  function goPrev() {
    setIndex((value) => (value - 1 + total) % total)
  }

  function goNext() {
    setIndex((value) => (value + 1) % total)
  }

  function handleTrailerClick(event) {
    if (event.target.closest('a, button')) return
    if (current.trailerUrl) onPlayTrailer(current)
  }

  return (
    <section className="spotlight">
      {showSides ? (
        <button className="spotlight-arrow spotlight-arrow--prev" type="button" onClick={goPrev} aria-label="Previous movie">
          ‹
        </button>
      ) : null}

      <div className="spotlight-track">
        {showSides ? (
          <button
            className="spotlight-side spotlight-side--prev"
            type="button"
            onClick={goPrev}
            aria-label={`View ${prevMovie.title}`}
          >
            {prevMovie.posterUrl ? <img src={prevMovie.posterUrl} alt={prevMovie.title} /> : <div className="poster-fallback" />}
          </button>
        ) : null}

        <div
          className={current.trailerUrl ? 'spotlight-main spotlight-main--playable' : 'spotlight-main'}
          style={current.posterUrl ? { '--hero-image': `url(${current.posterUrl})` } : undefined}
          onClick={handleTrailerClick}
          role={current.trailerUrl ? 'button' : undefined}
          tabIndex={current.trailerUrl ? 0 : undefined}
        >
          {current.trailerUrl ? (
            <span className="spotlight-main__play" aria-hidden="true">
              ▶
            </span>
          ) : null}

          <div className="spotlight-main__content">
            <span className="eyebrow">Now Showing</span>
            <h1>{current.title}</h1>
            <p>{formatLabel(current.genre)} · {current.durationMinutes ?? '-'} mins · {current.ageRating ?? 'NR'}</p>
            <div className="page-actions">
              <Link className="btn btn-danger" to={`/movies/${current.id}`}>Book Now</Link>
            </div>
          </div>
        </div>

        {showSides ? (
          <button
            className="spotlight-side spotlight-side--next"
            type="button"
            onClick={goNext}
            aria-label={`View ${nextMovie.title}`}
          >
            {nextMovie.posterUrl ? <img src={nextMovie.posterUrl} alt={nextMovie.title} /> : <div className="poster-fallback" />}
          </button>
        ) : null}
      </div>

      {showSides ? (
        <button className="spotlight-arrow spotlight-arrow--next" type="button" onClick={goNext} aria-label="Next movie">
          ›
        </button>
      ) : null}
    </section>
  )
}

function HomePage() {
  const { isAuthenticated } = useAuth()
  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  // The backend protects the movie catalog. Avoid a guaranteed 401 for a
  // guest landing on the public homepage; the chatbot still opens and offers
  // a login action for the authenticated conversation API.
  const { data: movies, error, loading } = useAsync(loadMovies, { initialData: [], immediate: isAuthenticated })
  const visibleMovies = isAuthenticated ? movies : EMPTY_MOVIES
  const [trailerMovie, setTrailerMovie] = useState(null)

  const nowShowing = useMemo(
    () => visibleMovies.filter((movie) => {
      if (movie.status) return movie.status === 'NOW_SHOWING'
      if (!movie.releaseDate) return false
      return new Date(movie.releaseDate) <= new Date()
    }),
    [visibleMovies],
  )
  
  const comingSoon = useMemo(
    () => visibleMovies.filter((movie) => movie.status === 'COMING_SOON' || (!movie.status && (!movie.releaseDate || new Date(movie.releaseDate) > new Date()))),
    [visibleMovies],
  )

  const loadMostWatched = useCallback(async () => {
    if (!nowShowing.length) return []

    const withReviewCounts = await Promise.all(
      nowShowing.map(async (movie) => {
        const reviews = await reviewService.listByMovie(movie.id).catch(() => [])
        return { movie, reviewCount: asArray(reviews).length }
      }),
    )

    return withReviewCounts
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 3)
      .map((entry) => entry.movie)
  }, [nowShowing])

  const { data: mostWatched } = useAsync(loadMostWatched, { initialData: [] })

  return (
    <div className="page-stack">
      <SpotlightCarousel movies={mostWatched} onPlayTrailer={setTrailerMovie} />

      {!isAuthenticated ? <div className="alert alert-info mb-0">Đăng nhập để tải catalog phim, lịch chiếu và đặt vé. Bạn vẫn có thể mở trợ lý 🤖 ở góc phải để bắt đầu.</div> : null}

      <DataState error={isAuthenticated ? error : null} loading={loading}>
        <section className="panel">
          <div className="panel-header">
            <h2>Now Showing</h2>
          </div>
          <MovieRow movies={nowShowing} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Coming Soon</h2>
          </div>
          <MovieRow movies={comingSoon} />
        </section>
      </DataState>

      {trailerMovie ? <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} /> : null}
    </div>
  )
}

export default HomePage