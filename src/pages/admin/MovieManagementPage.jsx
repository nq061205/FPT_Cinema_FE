import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { MOVIE_GENRES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { movieService } from '../../services/movie.service.js'

const EMPTY_FORM = { title: '', genre: 'ACTION', durationMinutes: '', ageRating: '', posterUrl: '', trailerUrl: '', description: '' }

function movieStatus(movie) {
  if (movie?.status) return movie.status
  if (movie?.releaseDate && new Date(movie.releaseDate) <= new Date()) return 'NOW_SHOWING'
  return 'COMING_SOON'
}

function MovieManagementPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)
  const loadMovies = useCallback(async () => asArray(await movieService.list()), [])
  const { data: movies, error, loading, execute } = useAsync(loadMovies, { initialData: [] })

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)
    try {
      await movieService.create({ ...form, durationMinutes: Number(form.durationMinutes) })
      setForm(EMPTY_FORM)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Movies" description="Create movie catalog entries consumed by the homepage and chatbot." />
      <div className="alert alert-info">Backend hiện tạo phim mới ở trạng thái COMING_SOON và chưa có API đổi status/release date; cần cập nhật dữ liệu backend trước khi tạo suất chiếu cho phim mới.</div>
      <ErrorMessage error={actionError} />
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="form-row"><label className="form-label">Title<input className="form-control" name="title" value={form.title} onChange={updateField} required /></label><label className="form-label">Genre<select className="form-select" name="genre" value={form.genre} onChange={updateField}>{MOVIE_GENRES.map((genre) => <option key={genre} value={genre}>{formatLabel(genre)}</option>)}</select></label></div>
        <div className="form-row"><label className="form-label">Duration (minutes)<input className="form-control" name="durationMinutes" type="number" min="1" value={form.durationMinutes} onChange={updateField} required /></label><label className="form-label">Age rating<input className="form-control" name="ageRating" placeholder="PG-13" value={form.ageRating} onChange={updateField} required /></label></div>
        <div className="form-row"><label className="form-label">Poster URL<input className="form-control" name="posterUrl" type="url" value={form.posterUrl} onChange={updateField} /></label><label className="form-label">Trailer URL<input className="form-control" name="trailerUrl" type="url" value={form.trailerUrl} onChange={updateField} /></label></div>
        <label className="form-label">Description<textarea className="form-control" name="description" rows="3" value={form.description} onChange={updateField} /></label>
        <button className="btn btn-danger" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create movie'}</button>
      </form>
      <DataState data={movies} emptyTitle="No movies" emptyDescription="Movie entries will appear here." error={error} loading={loading}>
        <div className="panel table-responsive"><table className="table align-middle"><thead><tr><th>Title</th><th>Genre</th><th>Duration</th><th>Status</th></tr></thead><tbody>{movies.map((movie) => <tr key={movie.id ?? movie.title}><td>{movie.title}</td><td>{formatLabel(movie.genre)}</td><td>{movie.durationMinutes} min</td><td><span className="status-pill">{formatLabel(movieStatus(movie))}</span></td></tr>)}</tbody></table></div>
      </DataState>
    </section>
  )
}

export default MovieManagementPage
