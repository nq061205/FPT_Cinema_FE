import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { userService } from '../../services/user.service.js'

function UserManagementPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [actionError, setActionError] = useState(null)
  const loadUsers = useCallback(async () => asArray(await userService.list()), [])
  const { data: users, error, loading, execute } = useAsync(loadUsers, { initialData: [] })

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setActionError(null)

    try {
      await userService.create(form)
      setForm({ fullName: '', email: '', phone: '', password: '' })
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Users" description="Account list and create flow for authorized staff." />
      <ErrorMessage error={actionError} />

      <form className="panel form-grid" onSubmit={handleCreate}>
        <div className="form-row">
          <input className="form-control" name="fullName" placeholder="Full name" value={form.fullName} onChange={updateField} required />
          <input className="form-control" name="email" type="email" placeholder="Email" value={form.email} onChange={updateField} required />
        </div>
        <div className="form-row">
          <input className="form-control" name="phone" placeholder="Phone" value={form.phone} onChange={updateField} />
          <input className="form-control" name="password" type="password" placeholder="Password" value={form.password} onChange={updateField} required />
        </div>
        <button className="btn btn-danger" type="submit">Create account</button>
      </form>

      <DataState data={users} emptyTitle="No users" emptyDescription="User accounts will appear here." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Level</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td><span className="status-pill">{formatLabel(user.status)}</span></td>
                  <td>{formatLabel(user.membershipLevel)}</td>
                  <td>{user.roleName ?? user.roleId ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default UserManagementPage
