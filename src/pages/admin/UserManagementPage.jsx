import { useCallback, useMemo, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { USER_STATUSES } from '../../constants/enums.js'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { asArray } from '../../lib/collections.js'
import { formatDateTime, formatLabel } from '../../lib/formatters.js'
import { userService } from '../../services/user.service.js'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const EMPTY_CREATE_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
}

const EMPTY_EDIT_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  status: 'ACTIVE',
}

function normalized(value) {
  return String(value ?? '').trim().toLocaleLowerCase('vi-VN')
}

function UserManagementPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(['CREATE_USER'])
  const canViewDetail = hasPermission(['USER_VIEW_DETAIL'])
  const canUpdate = hasPermission(['USER_UPDATE'])

  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [creating, setCreating] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [selectedUser, setSelectedUser] = useState(null)
  const [pendingAction, setPendingAction] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [filters, setFilters] = useState({ query: '', status: '', role: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const loadUsers = useCallback(async () => asArray(await userService.list()), [])
  const { data: users, error, loading, execute } = useAsync(loadUsers, { initialData: [] })

  const roleOptions = useMemo(
    () => [...new Set(users.map((user) => user.role).filter(Boolean))].sort((left, right) => left.localeCompare(right)),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const query = normalized(filters.query)

    return users.filter((user) => {
      const matchesQuery = !query || [user.id, user.fullName, user.email, user.phone]
        .some((value) => normalized(value).includes(query))
      const matchesStatus = !filters.status || user.status === filters.status
      const matchesRole = !filters.role || user.role === filters.role
      return matchesQuery && matchesStatus && matchesRole
    })
  }, [filters, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const visibleUsers = filteredUsers.slice(pageStart, pageStart + pageSize)

  function clearActionState() {
    setActionError(null)
    setSuccessMessage('')
  }

  function updateCreateField(event) {
    const { name, value } = event.target
    setCreateForm((current) => ({ ...current, [name]: value }))
  }

  function updateEditField(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters({ query: '', status: '', role: '' })
    setPage(1)
  }

  async function handleCreate(event) {
    event.preventDefault()
    clearActionState()
    setCreating(true)

    try {
      await userService.create({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
      })
      setCreateForm(EMPTY_CREATE_FORM)
      setSuccessMessage('Account created successfully.')
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setCreating(false)
    }
  }

  async function viewDetail(user) {
    clearActionState()
    setPendingAction(`detail-${user.id}`)

    try {
      setSelectedUser(await userService.getById(user.id))
    } catch (err) {
      setActionError(err)
    } finally {
      setPendingAction('')
    }
  }

  async function startEdit(user) {
    clearActionState()
    setPendingAction(`edit-${user.id}`)

    try {
      const source = canViewDetail ? await userService.getById(user.id) : user
      setEditingUser(source)
      setEditForm({
        fullName: source.fullName ?? '',
        email: source.email ?? '',
        phone: source.phone ?? '',
        password: '',
        status: source.status ?? 'ACTIVE',
      })
    } catch (err) {
      setActionError(err)
    } finally {
      setPendingAction('')
    }
  }

  async function handleEdit(event) {
    event.preventDefault()
    clearActionState()
    setSavingEdit(true)

    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        status: editForm.status,
      }
      if (editForm.password) payload.password = editForm.password

      const updatedUser = await userService.update(editingUser.id, payload)
      if (selectedUser?.id === updatedUser.id) setSelectedUser(updatedUser)
      setEditingUser(null)
      setSuccessMessage(`User #${updatedUser.id} updated successfully.`)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Management"
        title="Users"
        description="Search accounts, inspect user details, and update account information according to your permissions."
      />

      <ErrorMessage error={actionError} />
      {successMessage ? <div className="alert alert-success" role="status">{successMessage}</div> : null}

      {canCreate ? (
        <form className="panel form-grid" onSubmit={handleCreate}>
          <div className="panel-header"><h2>Create account</h2></div>
          <div className="form-row">
            <label className="form-label">
              Full name
              <input className="form-control" name="fullName" maxLength="100" value={createForm.fullName} onChange={updateCreateField} required />
            </label>
            <label className="form-label">
              Email
              <input className="form-control" name="email" type="email" maxLength="255" value={createForm.email} onChange={updateCreateField} required />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              Phone
              <input className="form-control" name="phone" inputMode="numeric" pattern="[0-9]{9,15}" title="Phone must contain 9 to 15 digits" value={createForm.phone} onChange={updateCreateField} required />
            </label>
            <label className="form-label">
              Password
              <input className="form-control" name="password" type="password" minLength="8" maxLength="100" value={createForm.password} onChange={updateCreateField} required />
            </label>
          </div>
          <div><button className="btn btn-danger" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create account'}</button></div>
        </form>
      ) : null}

      {selectedUser && canViewDetail ? (
        <section className="panel" aria-labelledby="user-detail-title">
          <div className="panel-header">
            <h2 id="user-detail-title">User detail #{selectedUser.id}</h2>
            <div className="d-flex gap-2">
              {canUpdate ? <button className="btn btn-danger btn-sm" type="button" onClick={() => startEdit(selectedUser)}>Edit</button> : null}
              <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
          <dl className="detail-list">
            <dt>Full name</dt><dd>{selectedUser.fullName ?? '-'}</dd>
            <dt>Email</dt><dd>{selectedUser.email ?? '-'}</dd>
            <dt>Phone</dt><dd>{selectedUser.phone ?? '-'}</dd>
            <dt>Status</dt><dd><span className="status-pill">{formatLabel(selectedUser.status)}</span></dd>
            <dt>Role</dt><dd>{selectedUser.role ?? '-'}</dd>
            <dt>Membership</dt><dd>{formatLabel(selectedUser.membershipLevel)}</dd>
            <dt>Reward points</dt><dd>{selectedUser.rewardPoints ?? 0}</dd>
            <dt>Created</dt><dd>{formatDateTime(selectedUser.createdAt)}</dd>
            <dt>Last updated</dt><dd>{formatDateTime(selectedUser.updatedAt)}</dd>
          </dl>
        </section>
      ) : null}

      {editingUser && canUpdate ? (
        <form className="panel form-grid" onSubmit={handleEdit}>
          <div className="panel-header">
            <h2>Edit user #{editingUser.id}</h2>
            <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setEditingUser(null)}>Cancel</button>
          </div>
          <div className="form-row">
            <label className="form-label">
              Full name
              <input className="form-control" name="fullName" maxLength="100" value={editForm.fullName} onChange={updateEditField} required />
            </label>
            <label className="form-label">
              Email
              <input className="form-control" name="email" type="email" maxLength="255" value={editForm.email} onChange={updateEditField} required />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              Phone
              <input className="form-control" name="phone" inputMode="numeric" pattern="[0-9]{9,15}" title="Phone must contain 9 to 15 digits" value={editForm.phone} onChange={updateEditField} required />
            </label>
            <label className="form-label">
              New password (optional)
              <input className="form-control" name="password" type="password" minLength="8" maxLength="100" value={editForm.password} onChange={updateEditField} autoComplete="new-password" />
            </label>
          </div>
          <label className="form-label">
            Account status
            <select className="form-select" name="status" value={editForm.status} onChange={updateEditField}>
              {USER_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
            </select>
          </label>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-danger" type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save changes'}</button>
            <small className="muted">Role and permissions are managed separately in Access control.</small>
          </div>
        </form>
      ) : null}

      <section className="panel filter-bar" aria-label="User filters">
        <label className="form-label">
          Search
          <input className="form-control" name="query" type="search" placeholder="Name, email, phone, or ID" value={filters.query} onChange={updateFilter} />
        </label>
        <label className="form-label">
          Status
          <select className="form-select" name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All statuses</option>
            {USER_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
          </select>
        </label>
        <label className="form-label">
          Role
          <select className="form-select" name="role" value={filters.role} onChange={updateFilter}>
            <option value="">All roles</option>
            {roleOptions.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
          </select>
        </label>
        <label className="form-label">
          Rows per page
          <select className="form-select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button className="btn btn-outline-dark" type="button" onClick={resetFilters}>Reset filters</button>
      </section>

      <DataState
        data={visibleUsers}
        emptyTitle={users.length ? 'No matching users' : 'No users'}
        emptyDescription={users.length ? 'Try changing or resetting the filters.' : 'User accounts will appear here.'}
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <div className="panel-header">
            <h2>User list</h2>
            <span className="muted">{filteredUsers.length} of {users.length} account(s)</span>
          </div>
          <table className="table align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Level</th>
                <th>Role</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td><span className="status-pill">{formatLabel(user.status)}</span></td>
                  <td>{formatLabel(user.membershipLevel)}</td>
                  <td>{user.role ?? '-'}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      {canViewDetail ? (
                        <button className="btn btn-outline-dark btn-sm" type="button" disabled={Boolean(pendingAction)} onClick={() => viewDetail(user)}>
                          {pendingAction === `detail-${user.id}` ? 'Loading...' : 'Detail'}
                        </button>
                      ) : null}
                      {canUpdate ? (
                        <button className="btn btn-danger btn-sm" type="button" disabled={Boolean(pendingAction)} onClick={() => startEdit(user)}>
                          {pendingAction === `edit-${user.id}` ? 'Loading...' : 'Edit'}
                        </button>
                      ) : null}
                      {!canViewDetail && !canUpdate ? <span className="muted">View only</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>

      {!loading && !error && filteredUsers.length ? (
        <nav className="panel d-flex flex-wrap align-items-center justify-content-between gap-3" aria-label="User list pagination">
          <span className="muted">
            Showing {pageStart + 1}-{Math.min(pageStart + pageSize, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-dark btn-sm" type="button" disabled={currentPage === 1} onClick={() => setPage(1)}>First</button>
            <button className="btn btn-outline-dark btn-sm" type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span className="status-pill">Page {currentPage} / {totalPages}</span>
            <button className="btn btn-outline-dark btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
            <button className="btn btn-outline-dark btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last</button>
          </div>
        </nav>
      ) : null}
    </section>
  )
}

export default UserManagementPage
