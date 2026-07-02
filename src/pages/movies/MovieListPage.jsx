import { useCallback } from 'react'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'

function MovieListPage() {
  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies, error, loading, execute } = useAsync(loadMovies, { initialData: [] })

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Catalog"
        title="Movies"
        description="Movie list from /api/movies/list."
        actions={<button className="btn btn-outline-dark" type="button" onClick={() => execute()}>Refresh</button>}
      />

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
