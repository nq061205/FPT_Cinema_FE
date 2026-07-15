import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { MOVIE_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'

function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''

  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies, error, loading, execute } = useAsync(loadMovies, { initialData: [] })

  const filteredMovies = useMemo(() => {
    if (!status) return movies
    return movies.filter((movie) => String(movie.status ?? 'NOW_SHOWING').toUpperCase() === status.toUpperCase())
  }, [movies, status])

  function updateStatus(event) {
    const value = event.target.value
    setSearchParams(value ? { status: value } : {})
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Catalog"
        title="Movies"
        description="Movie list from /api/movies/list."
        actions={<button className="btn btn-outline-dark" type="button" onClick={() => execute()}>Refresh</button>}
      />

      <div className="filter-bar">
        <select className="form-select" onChange={updateStatus} value={status}>
          <option value="">All statuses</option>
          {MOVIE_STATUSES.map((item) => (
            <option key={item} value={item}>{formatLabel(item)}</option>
          ))}
        </select>
      </div>

      <DataState
        data={filteredMovies}
        emptyTitle="No movies"
        emptyDescription="Movies created in backend will appear here."
        error={error}
        loading={loading}
      >
        {filteredMovies.length ? (
          <div className="movie-grid">
            {filteredMovies.map((movie) => (
              <article className="movie-card" key={movie.id ?? movie.title}>
                {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <div className="poster-fallback" />}
                <div>
                  <h2>{movie.title}</h2>
                  <p>{formatLabel(movie.genre)} · {movie.durationMinutes ?? '-'} min · {movie.ageRating ?? 'NR'}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DataState>
    </section>
  )
}

export default MovieListPage
