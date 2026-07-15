import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { MOVIE_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'

function MovieListPage() {
  // Logic từ HEAD (Lọc theo trạng thái)
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''

  // Logic từ origin/main (Tìm kiếm bằng text)
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

  // Kết hợp lọc trạng thái sau khi đã lấy danh sách từ server
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
        eyebrow="Danh mục"
        title="Phim"
        description="Danh sách phim từ /api/movies/list."
        actions={<button className="btn btn-outline-dark" type="button" onClick={() => execute()}>Làm mới</button>}
      />

      {/* Gộp cả Form tìm kiếm và Dropdown lọc vào chung một khu vực */}
      <div className="filter-bar d-flex gap-3 align-items-center flex-wrap">
        <form className="d-flex gap-2 flex-grow-1" onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); setSearchMode(true) }}>
          <input className="form-control" placeholder="Tìm tên phim..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="btn btn-danger" type="submit">Tìm kiếm API</button>
          {searchMode ? <button className="btn btn-outline-dark" type="button" onClick={() => { setQuery(''); setSubmittedQuery(''); setSearchMode(false) }}>Tất cả phim</button> : null}
        </form>

        <select className="form-select w-auto" onChange={updateStatus} value={status}>
          <option value="">Tất cả trạng thái</option>
          {MOVIE_STATUSES.map((item) => (
            <option key={item} value={item}>{formatLabel(item)}</option>
          ))}
        </select>
      </div>

      <DataState
        data={filteredMovies}
        emptyTitle="Không có phim nào"
        emptyDescription="Phim được tạo trong backend sẽ xuất hiện ở đây."
        error={error}
        loading={loading}
      >
        {filteredMovies.length ? (
          <div className="movie-grid">
            {/* Dùng filteredMovies kết hợp thẻ Link từ origin/main */}
            {filteredMovies.map((movie) => (
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