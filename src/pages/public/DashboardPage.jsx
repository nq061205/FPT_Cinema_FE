import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import { asArray } from '../../lib/collections.js'
import { formatDateTime, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { showtimeService } from '../../services/showtime.service.js'

function DashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [movies, showtimes] = await Promise.all([
      movieService.list(),
      showtimeService.list({ size: 5 }),
    ])

    return { movies: asArray(movies), showtimes: asArray(showtimes) }
  }, [])

  const { data, error, loading } = useAsync(loadDashboard, {
    initialData: { movies: [], showtimes: [] },
  })

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Live modules connected to the Spring Boot backend."
        actions={<Link className="btn btn-danger" to="/booking">New booking</Link>}
      />

      <DataState error={error} loading={loading}>
        <div className="stat-grid">
          <StatCard label="Movies" value={data.movies.length} tone="red" />
          <StatCard label="Upcoming showtimes" value={data.showtimes.length} tone="gold" />
          <StatCard label="Active module" value="Booking" tone="green" />
        </div>

        <div className="grid-two">
          <article className="panel">
            <div className="panel-header">
              <h2>Movies</h2>
              <Link to="/movies">View all</Link>
            </div>
            <div className="compact-list">
              {data.movies.slice(0, 5).map((movie) => (
                <Link className="compact-row" key={movie.id ?? movie.title} to="/movies">
                  <span>{movie.title}</span>
                  <small>{formatLabel(movie.genre)}</small>
                </Link>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <h2>Showtimes</h2>
              <Link to="/showtimes">Schedule</Link>
            </div>
            <div className="compact-list">
              {data.showtimes.map((showtime) => (
                <Link className="compact-row" key={showtime.id ?? showtime.startTime} to="/showtimes">
                  <span>{showtime.movieTitle ?? `Movie #${showtime.movieId}`}</span>
                  <small>{formatDateTime(showtime.startTime)}</small>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </DataState>
    </section>
  )
}

export default DashboardPage
