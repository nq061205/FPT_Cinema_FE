import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'

function MovieListPage() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const loadMovies = useCallback(async () => {
    if (searchMode) {
      const movies = asArray(await movieService.search({ page: 0, size: 50 }))
      const normalizedQuery = submittedQuery.toLowerCase()
      return normalizedQuery ? movies.filter((movie) => String(movie.title ?? '').toLowerCase().includes(normalizedQuery)) : movies
    }
    return asArray(await movieService.list())
  }, [searchMode, submittedQuery])
  const { data: movies, error, loading, execute } = useAsync(loadMovies, { initialData: [] })

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Catalog"
        title="Movies"
        description="Movie list from /api/movies/list."
        actions={<button className="btn btn-outline-dark" type="button" onClick={() => execute()}>Refresh</button>}
      />

      <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); setSearchMode(true) }}>
        <input className="form-control" placeholder="Search movie title" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="btn btn-danger" type="submit">Search API</button>
        {searchMode ? <button className="btn btn-outline-dark" type="button" onClick={() => { setQuery(''); setSubmittedQuery(''); setSearchMode(false) }}>All movies</button> : null}
      </form>

      <DataState
        data={movies}
        emptyTitle="No movies"
        emptyDescription="Movies created in backend will appear here."
        error={error}
        loading={loading}
      >
        {movies.length ? (
          <div className="movie-grid">
            {movies.map((movie) => (
              <Link
                className="movie-card"
                key={movie.id ?? movie.title}
                to={`/movies/${movie.id}`}
                aria-label={`Xem chi tiết ${movie.title}`}
              >
                {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <div className="poster-fallback" />}
                <div>
                  <h2>{movie.title}</h2>
                  <p>{formatLabel(movie.genre)} · {movie.durationMinutes ?? '-'} min · {movie.ageRating ?? 'NR'}</p>
                </div>
              </Link>
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
