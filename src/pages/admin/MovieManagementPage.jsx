import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { MOVIE_GENRES, MOVIE_STATUSES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'
import { reviewService } from '../../services/review.service.js'

const emptyMovieForm = {
  title: '',
  genre: MOVIE_GENRES[0],
  durationMinutes: '',
  ageRating: '',
  description: '',
  posterUrl: '',
  trailerUrl: '',
  status: 'NOW_SHOWING',
  releaseDate: '',
}

function MovieManagementPage() {
  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies, error, loading, execute } = useAsync(loadMovies, { initialData: [] })

  const [filters, setFilters] = useState({ title: '', genre: '', status: '' })
  const [form, setForm] = useState(emptyMovieForm)
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      if (filters.title && !movie.title?.toLowerCase().includes(filters.title.toLowerCase())) return false
      if (filters.genre && movie.genre !== filters.genre) return false
      if (filters.status && movie.status !== filters.status) return false
      return true
    })
  }, [movies, filters])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEdit(movie) {
    setEditingId(movie.id)
    setForm({
      title: movie.title ?? '',
      genre: movie.genre ?? MOVIE_GENRES[0],
      durationMinutes: movie.durationMinutes ?? '',
      ageRating: movie.ageRating ?? '',
      description: movie.description ?? '',
      posterUrl: movie.posterUrl ?? '',
      trailerUrl: movie.trailerUrl ?? '',
      status: movie.status ?? 'NOW_SHOWING',
      releaseDate: movie.releaseDate ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyMovieForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)

    const payload = { ...form, durationMinutes: Number(form.durationMinutes) || 0 }

    try {
      if (editingId) {
        await movieService.update(editingId, payload)
      } else {
        await movieService.create(payload)
      }

      cancelEdit()
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(movie) {
    if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return

    setActionError(null)
    setDeletingId(movie.id)

    try {
      await movieService.remove(movie.id)
      if (editingId === movie.id) cancelEdit()
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Management"
        title="Movie Management"
        description="Create, update, and delete movies."
        actions={<Link className="btn btn-outline-dark" to="/admin/reports">View revenue / statistics</Link>}
      />

      <ErrorMessage error={actionError} />

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>{editingId ? 'Update Movie' : 'Create New Movie'}</h2>
          {editingId ? (
            <button className="btn btn-outline-dark btn-sm" type="button" onClick={cancelEdit}>Cancel Edit</button>
          ) : null}
        </div>

        <div className="form-row">
          <label className="form-label">
            Movie Title
            <input className="form-control" name="title" value={form.title} onChange={updateField} required />
          </label>
          <label className="form-label">
            Genre
            <select className="form-select" name="genre" value={form.genre} onChange={updateField}>
              {MOVIE_GENRES.map((genre) => (
                <option key={genre} value={genre}>{formatLabel(genre)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            Duration (minutes)
            <input className="form-control" name="durationMinutes" type="number" min="0" value={form.durationMinutes} onChange={updateField} required />
          </label>
          <label className="form-label">
            Age Rating
            <input className="form-control" name="ageRating" placeholder="e.g. T13" value={form.ageRating} onChange={updateField} />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            Release Date
            <input className="form-control" name="releaseDate" type="date" value={form.releaseDate} onChange={updateField} />
          </label>
        </div>

        <label className="form-label">
          Description
          <textarea className="form-control" name="description" rows="3" value={form.description} onChange={updateField} />
        </label>

        <div className="form-row">
          <label className="form-label">
            Poster URL
            <input className="form-control" name="posterUrl" value={form.posterUrl} onChange={updateField} />
          </label>
          <label className="form-label">
            Trailer URL
            <input className="form-control" name="trailerUrl" value={form.trailerUrl} onChange={updateField} />
          </label>
        </div>

        <label className="form-label">
          Status
          <select className="form-select" name="status" value={form.status} onChange={updateField}>
            {MOVIE_STATUSES.map((status) => (
              <option key={status} value={status}>{formatLabel(status)}</option>
            ))}
          </select>
        </label>

        <button className="btn btn-danger" disabled={saving} type="submit">
          {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Movie'}
        </button>
      </form>

      <div className="filter-bar">
        <input className="form-control" name="title" placeholder="Search by movie title" value={filters.title} onChange={updateFilter} />
        <select className="form-select" name="genre" value={filters.genre} onChange={updateFilter}>
          <option value="">All genres</option>
          {MOVIE_GENRES.map((genre) => (
            <option key={genre} value={genre}>{formatLabel(genre)}</option>
          ))}
        </select>
        <select className="form-select" name="status" value={filters.status} onChange={updateFilter}>
          <option value="">All statuses</option>
          {MOVIE_STATUSES.map((status) => (
            <option key={status} value={status}>{formatLabel(status)}</option>
          ))}
        </select>
      </div>

      <DataState data={filteredMovies} emptyTitle="No movies found" emptyDescription="Create a new movie to start." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Movie Title</th>
                <th>Genre</th>
                <th>Duration</th>
                <th>Release Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr key={movie.id}>
                  <td>{movie.title}</td>
                  <td>{formatLabel(movie.genre)}</td>
                  <td>{movie.durationMinutes ?? '-'} mins</td>
                  <td>{movie.releaseDate ?? '-'}</td>
                  <td><span className="status-pill">{formatLabel(movie.status)}</span></td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-dark" type="button" onClick={() => startEdit(movie)}>Edit</button>
                      <button
                        className="btn btn-outline-dark"
                        disabled={deletingId === movie.id}
                        onClick={() => handleDelete(movie)}
                        type="button"
                      >
                        {deletingId === movie.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      <MostWatchedPanel movies={movies} />
    </section>
  )
}

function MostWatchedPanel({ movies }) {
  const loadCounts = useCallback(async () => {
    const withCounts = await Promise.all(
      movies.map(async (movie) => {
        const reviews = await reviewService.listByMovie(movie.id).catch(() => [])
        return { movie, reviewCount: asArray(reviews).length }
      }),
    )

    return withCounts.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5)
  }, [movies])

  const { data: ranking, loading } = useAsync(loadCounts, { initialData: [] })

  if (!movies.length) return null

  return (
    <article className="panel">
      <div className="panel-header">
        <h2>Most Watched Movies</h2>
      </div>
      {loading ? (
        <p className="muted">Calculating...</p>
      ) : (
        <div className="compact-list">
          {ranking.map(({ movie, reviewCount }) => (
            <div className="compact-row" key={movie.id}>
              <span>{movie.title}</span>
              <small>{reviewCount} reviews</small>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export default MovieManagementPage
