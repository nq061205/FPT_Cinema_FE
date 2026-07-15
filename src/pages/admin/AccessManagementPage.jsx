import { useCallback, useEffect, useMemo, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { asArray } from '../../lib/collections.js'
import { permissionService, roleService, userService } from '../../services/user.service.js'

const EMPTY_PERMISSION = { id: '', permissionCode: '', permissionName: '', description: '' }

/**
 * The API normally returns a bare array after apiClient unwraps ApiResponse.
 * Keeping this helper tolerant of paged or named collections makes the page
 * work with both the current backend and older deployments.
 */
function collection(payload, keys = []) {
  if (Array.isArray(payload)) return payload
  const array = asArray(payload)
  if (array.length) return array
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  return []
}

function permissionId(item) {
  return item?.permissionId ?? item?.permission?.id ?? (item?.permissionCode ? item.id : null)
}

function roleId(item) {
  return item?.roleId ?? item?.role?.id ?? item?.id
}

function permissionLabel(permission) {
  return `${permission.permissionCode ?? 'UNKNOWN'}${permission.permissionName ? ` — ${permission.permissionName}` : ''}`
}

function displayUser(user) {
  return `${user.fullName ?? 'Unnamed user'}${user.email ? ` (${user.email})` : ''}`
}

function AccessManagementPage() {
  const { hasPermission, hasRole } = useAuth()
  const isAdmin = hasRole(['ADMIN'])
  const canCreatePermission = isAdmin || hasPermission(['PERMISSION_CREATE'])
  const canUpdatePermission = isAdmin || hasPermission(['PERMISSION_UPDATE'])
  const canEditRolePermissions = isAdmin || hasPermission(['ROLE_PERMISSION_ASSIGN'])
  const canAssignUserPermission = isAdmin || hasPermission(['USER_PERMISSION_ASSIGN'])
  const canAssignUserRole = isAdmin || hasPermission(['USER_ROLE_ASSIGN'])

  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState(null)
  const [catalogWarnings, setCatalogWarnings] = useState([])
  const [busyAction, setBusyAction] = useState('')
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const [createForm, setCreateForm] = useState({ permissionCode: '', permissionName: '', description: '' })
  const [updateForm, setUpdateForm] = useState(EMPTY_PERMISSION)

  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rolePermissionIds, setRolePermissionIds] = useState([])
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false)
  const [rolePermissionsError, setRolePermissionsError] = useState(null)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [userPermissions, setUserPermissions] = useState([])
  const [userAccessLoading, setUserAccessLoading] = useState(false)
  const [userAccessError, setUserAccessError] = useState(null)
  const [assignPermissionId, setAssignPermissionId] = useState('')
  const [assignPermissionGranted, setAssignPermissionGranted] = useState(true)
  const [assignRoleId, setAssignRoleId] = useState('')

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    setCatalogWarnings([])

    const [permissionResult, roleResult, userResult] = await Promise.allSettled([
      permissionService.list(),
      roleService.list(),
      userService.list(),
    ])

    const warnings = []
    if (permissionResult.status === 'fulfilled') {
      setPermissions(collection(permissionResult.value, ['permissions']))
    } else {
      warnings.push(`Không thể tải danh sách permission: ${permissionResult.reason?.message ?? 'Request failed'}`)
      setPermissions([])
    }

    if (userResult.status === 'fulfilled') {
      const nextUsers = collection(userResult.value, ['users'])
      setUsers(nextUsers)
    } else {
      warnings.push(`Không thể tải danh sách tài khoản: ${userResult.reason?.message ?? 'Request failed'}`)
      setUsers([])
    }

    if (roleResult.status === 'fulfilled') {
      setRoles(collection(roleResult.value, ['roles']))
    } else {
      // Older backends did not expose GET /roles. Derive the roles present in
      // the user list so assigning a role still remains possible.
      const derivedRoles = (userResult.status === 'fulfilled' ? collection(userResult.value, ['users']) : [])
        .filter((user) => user.roleId || user.role)
        .map((user) => ({ id: user.roleId, roleName: user.role }))
        .filter((role, index, source) => role.id && source.findIndex((item) => String(item.id) === String(role.id)) === index)
      setRoles(derivedRoles)
      warnings.push(`Không thể tải danh sách role: ${roleResult.reason?.message ?? 'Request failed'}`)
    }

    if (permissionResult.status === 'rejected' && roleResult.status === 'rejected' && userResult.status === 'rejected') {
      setCatalogError(permissionResult.reason)
    }
    setCatalogWarnings(warnings)
    setCatalogLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) loadCatalog()
    })
    return () => {
      cancelled = true
    }
  }, [loadCatalog])

  useEffect(() => {
    queueMicrotask(() => setSelectedRoleId((current) => {
      if (current && roles.some((role) => String(roleId(role)) === String(current))) return current
      const preferredRole = roles.find((role) => String(role.roleName ?? role.name ?? '').toUpperCase() === 'ADMIN') ?? roles[0]
      const firstRoleId = preferredRole ? roleId(preferredRole) : null
      return firstRoleId ? String(firstRoleId) : ''
    }))
  }, [roles])

  useEffect(() => {
    queueMicrotask(() => setSelectedUserId((current) => {
      if (current && users.some((user) => String(user.id) === String(current))) return current
      return users[0]?.id ? String(users[0].id) : ''
    }))
  }, [users])

  const selectedRole = useMemo(
    () => roles.find((role) => String(roleId(role)) === String(selectedRoleId)),
    [roles, selectedRoleId],
  )

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)),
    [users, selectedUserId],
  )

  const loadRolePermissions = useCallback(async (roleIdValue) => {
    if (!roleIdValue) {
      setRolePermissionIds([])
      setRolePermissionsError(null)
      return
    }

    setRolePermissionsLoading(true)
    setRolePermissionsError(null)
    try {
      const response = await permissionService.rolePermissions(roleIdValue)
      const entries = collection(response, ['permissions', 'rolePermissions'])
      setRolePermissionIds(entries.map(permissionId).filter(Boolean).map(String))
    } catch (error) {
      setRolePermissionsError(error)
      setRolePermissionIds([])
    } finally {
      setRolePermissionsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) loadRolePermissions(selectedRoleId)
    })
    return () => {
      cancelled = true
    }
  }, [loadRolePermissions, selectedRoleId])

  const loadUserAccess = useCallback(async (userIdValue) => {
    if (!userIdValue) {
      setSelectedUserDetail(null)
      setUserPermissions([])
      setUserAccessError(null)
      return
    }

    setUserAccessLoading(true)
    setUserAccessError(null)
    try {
      const [detailResult, permissionResult] = await Promise.allSettled([
        userService.getById(userIdValue),
        userService.getPermissions(userIdValue),
      ])
      if (detailResult.status === 'fulfilled') setSelectedUserDetail(detailResult.value)
      else setSelectedUserDetail(selectedUser ?? null)
      if (permissionResult.status === 'fulfilled') {
        setUserPermissions(collection(permissionResult.value, ['permissions', 'userPermissions']))
      } else {
        throw permissionResult.reason
      }
    } catch (error) {
      setUserAccessError(error)
      setUserPermissions([])
    } finally {
      setUserAccessLoading(false)
    }
  }, [selectedUser])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) loadUserAccess(selectedUserId)
    })
    return () => {
      cancelled = true
    }
  }, [loadUserAccess, selectedUserId])

  function clearFeedback() {
    setActionError(null)
    setSuccessMessage('')
  }

  function updateFormField(setter) {
    return (event) => {
      const { name, value } = event.target
      setter((current) => ({ ...current, [name]: value }))
    }
  }

  async function runAction(actionKey, successText, action) {
    clearFeedback()
    setBusyAction(actionKey)
    try {
      await action()
      setSuccessMessage(successText)
    } catch (error) {
      setActionError(error)
    } finally {
      setBusyAction('')
    }
  }

  async function handleCreatePermission(event) {
    event.preventDefault()
    await runAction('create-permission', 'Đã tạo permission.', async () => {
      await permissionService.create({
        permissionCode: createForm.permissionCode.trim().toUpperCase(),
        permissionName: createForm.permissionName.trim(),
        description: createForm.description.trim() || undefined,
      })
      setCreateForm({ permissionCode: '', permissionName: '', description: '' })
      await loadCatalog()
    })
  }

  async function handleUpdatePermission(event) {
    event.preventDefault()
    if (!updateForm.id) return
    await runAction('update-permission', 'Đã cập nhật permission.', async () => {
      await permissionService.update(Number(updateForm.id), {
        permissionCode: updateForm.permissionCode.trim().toUpperCase() || undefined,
        permissionName: updateForm.permissionName.trim() || undefined,
        description: updateForm.description.trim() || undefined,
      })
      await loadCatalog()
    })
  }

  function handlePermissionSelection(event) {
    const selected = permissions.find((permission) => String(permission.id) === event.target.value)
    setUpdateForm(selected ? {
      id: selected.id,
      permissionCode: selected.permissionCode ?? '',
      permissionName: selected.permissionName ?? '',
      description: selected.description ?? '',
    } : EMPTY_PERMISSION)
  }

  function toggleRolePermission(permission) {
    const id = String(permission.id)
    setRolePermissionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function handleSaveRolePermissions(event) {
    event.preventDefault()
    if (!selectedRoleId) return
    await runAction('role-permissions', `Đã cập nhật permission cho role ${selectedRole?.roleName ?? selectedRoleId}.`, async () => {
      await permissionService.replaceRolePermissions(Number(selectedRoleId), rolePermissionIds.map(Number))
      await loadRolePermissions(selectedRoleId)
    })
  }

  async function handleAssignUserPermission(event) {
    event.preventDefault()
    if (!selectedUserId || !assignPermissionId) return
    await runAction('user-permission', 'Đã cập nhật permission trực tiếp cho tài khoản.', async () => {
      await userService.assignPermission(Number(selectedUserId), Number(assignPermissionId), {
        isGranted: assignPermissionGranted,
      })
      await loadUserAccess(selectedUserId)
    })
  }

  async function handleAssignUserRole(event) {
    event.preventDefault()
    if (!selectedUserId || !assignRoleId) return
    await runAction('user-role', 'Đã gán role cho tài khoản.', async () => {
      await userService.assignRole(Number(selectedUserId), Number(assignRoleId))
      await loadCatalog()
      await loadUserAccess(selectedUserId)
    })
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Security"
        title="Access control"
        description="Quản lý permission, cấu hình permission cho từng role và gán quyền trực tiếp cho tài khoản."
        actions={<button className="btn btn-outline-dark" type="button" onClick={loadCatalog} disabled={catalogLoading}>Làm mới dữ liệu</button>}
      />

      {catalogError ? <ErrorMessage error={catalogError} title="Không thể tải dữ liệu phân quyền" /> : null}
      {catalogWarnings.map((warning) => <div className="alert alert-warning" role="alert" key={warning}>{warning}</div>)}
      <ErrorMessage error={actionError} />
      {successMessage ? <div className="alert alert-success" role="status">{successMessage}</div> : null}

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleCreatePermission}>
          <div className="panel-header"><h2>Tạo permission</h2><span className="status-pill">{permissions.length} permissions</span></div>
          {!canCreatePermission ? <p className="muted">Bạn cần quyền PERMISSION_CREATE hoặc role ADMIN.</p> : null}
          <input className="form-control" name="permissionCode" placeholder="PERMISSION_CODE" value={createForm.permissionCode} onChange={updateFormField(setCreateForm)} required disabled={!canCreatePermission} />
          <input className="form-control" name="permissionName" placeholder="Tên permission" value={createForm.permissionName} onChange={updateFormField(setCreateForm)} required disabled={!canCreatePermission} />
          <textarea className="form-control" name="description" placeholder="Mô tả" value={createForm.description} onChange={updateFormField(setCreateForm)} rows="2" disabled={!canCreatePermission} />
          <button className="btn btn-danger" type="submit" disabled={!canCreatePermission || busyAction === 'create-permission'}>{busyAction === 'create-permission' ? 'Đang tạo...' : 'Tạo permission'}</button>
        </form>

        <form className="panel form-grid" onSubmit={handleUpdatePermission}>
          <div className="panel-header"><h2>Sửa permission</h2></div>
          {!canUpdatePermission ? <p className="muted">Bạn cần quyền PERMISSION_UPDATE hoặc role ADMIN.</p> : null}
          <select className="form-select" value={String(updateForm.id)} onChange={handlePermissionSelection} disabled={!canUpdatePermission || catalogLoading} required>
            <option value="">Chọn permission cần sửa</option>
            {permissions.map((permission) => <option key={permission.id} value={permission.id}>{permissionLabel(permission)}</option>)}
          </select>
          <input className="form-control" name="permissionCode" placeholder="Mã permission" value={updateForm.permissionCode} onChange={updateFormField(setUpdateForm)} required disabled={!canUpdatePermission || !updateForm.id} />
          <input className="form-control" name="permissionName" placeholder="Tên permission" value={updateForm.permissionName} onChange={updateFormField(setUpdateForm)} required disabled={!canUpdatePermission || !updateForm.id} />
          <textarea className="form-control" name="description" placeholder="Mô tả" value={updateForm.description} onChange={updateFormField(setUpdateForm)} rows="2" disabled={!canUpdatePermission || !updateForm.id} />
          <button className="btn btn-outline-dark" type="submit" disabled={!canUpdatePermission || !updateForm.id || busyAction === 'update-permission'}>{busyAction === 'update-permission' ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </form>
      </div>

      <form className="panel form-grid" onSubmit={handleSaveRolePermissions}>
        <div className="panel-header"><div><h2>Permission của role</h2><p className="muted mb-0">Chọn role ADMIN, STAFF, MANAGER hoặc CUSTOMER rồi bật/tắt các permission.</p></div><span className="status-pill">{rolePermissionIds.length} đang bật</span></div>
        {!canEditRolePermissions ? <div className="alert alert-info">Bạn cần quyền ROLE_PERMISSION_ASSIGN hoặc role ADMIN để chỉnh sửa.</div> : null}
        <select className="form-select" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} disabled={!roles.length || rolePermissionsLoading}>
          <option value="">Chọn role</option>
          {roles.map((role) => <option key={roleId(role)} value={roleId(role)}>{role.roleName ?? role.name ?? `Role #${roleId(role)}`}</option>)}
        </select>
        <ErrorMessage error={rolePermissionsError} title="Không thể tải permission của role" />
        {rolePermissionsLoading ? <div className="muted">Đang tải permission của role...</div> : null}
        {!rolePermissionsLoading && !permissions.length ? <div className="alert alert-warning">Chưa có danh sách permission để cấu hình.</div> : null}
        {!rolePermissionsLoading && permissions.length ? <div className="grid-two">
          {permissions.map((permission) => {
            const checked = rolePermissionIds.includes(String(permission.id))
            return <label className="form-check compact-row" key={permission.id}><span><input className="form-check-input me-2" type="checkbox" checked={checked} onChange={() => toggleRolePermission(permission)} disabled={!canEditRolePermissions || !selectedRoleId} />{permissionLabel(permission)}</span><small>{checked ? 'Được cấp' : 'Chưa cấp'}</small></label>
          })}
        </div> : null}
        <button className="btn btn-danger" type="submit" disabled={!canEditRolePermissions || !selectedRoleId || rolePermissionsLoading || busyAction === 'role-permissions'}>{busyAction === 'role-permissions' ? 'Đang lưu...' : 'Lưu permission cho role'}</button>
      </form>

      <section className="panel form-grid">
        <div className="panel-header"><div><h2>Quyền của tài khoản</h2><p className="muted mb-0">Gán role và permission override (grant/revoke) cho từng user.</p></div><span className="status-pill">{users.length} tài khoản</span></div>
        {!users.length && !catalogLoading ? <DataState data={users} emptyTitle="Chưa có tài khoản" emptyDescription="Danh sách tài khoản sẽ hiển thị ở đây." error={null} loading={false}><span /></DataState> : null}
        <select className="form-select" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} disabled={!users.length || catalogLoading}>
          <option value="">Chọn tài khoản</option>
          {users.map((user) => <option key={user.id} value={user.id}>{displayUser(user)}</option>)}
        </select>
        {selectedUserDetail || selectedUser ? <dl className="detail-list">
          <dt>Họ tên</dt><dd>{selectedUserDetail?.fullName ?? selectedUser?.fullName ?? '-'}</dd>
          <dt>Email</dt><dd>{selectedUserDetail?.email ?? selectedUser?.email ?? '-'}</dd>
          <dt>Role hiện tại</dt><dd>{selectedUserDetail?.role ?? selectedUser?.role ?? selectedUser?.roleId ?? '-'}</dd>
          <dt>Trạng thái</dt><dd>{selectedUserDetail?.status ?? selectedUser?.status ?? '-'}</dd>
        </dl> : null}
        <ErrorMessage error={userAccessError} title="Không thể tải quyền của tài khoản" />
        {userAccessLoading ? <div className="muted">Đang tải quyền tài khoản...</div> : null}

        <div className="grid-two">
          <form className="form-grid" onSubmit={handleAssignUserRole}>
            <h3>Gán role</h3>
            <select className="form-select" value={assignRoleId} onChange={(event) => setAssignRoleId(event.target.value)} disabled={!canAssignUserRole || !selectedUserId} required>
              <option value="">Chọn role mới</option>
              {roles.map((role) => <option key={roleId(role)} value={roleId(role)}>{role.roleName ?? role.name ?? `Role #${roleId(role)}`}</option>)}
            </select>
            <button className="btn btn-outline-dark" type="submit" disabled={!canAssignUserRole || !selectedUserId || !assignRoleId || busyAction === 'user-role'}>{busyAction === 'user-role' ? 'Đang gán...' : 'Gán role cho user'}</button>
          </form>

          <form className="form-grid" onSubmit={handleAssignUserPermission}>
            <h3>Gán permission trực tiếp</h3>
            <select className="form-select" value={assignPermissionId} onChange={(event) => setAssignPermissionId(event.target.value)} disabled={!canAssignUserPermission || !selectedUserId} required>
              <option value="">Chọn permission</option>
              {permissions.map((permission) => <option key={permission.id} value={permission.id}>{permissionLabel(permission)}</option>)}
            </select>
            <label className="form-check"><input className="form-check-input" type="checkbox" checked={assignPermissionGranted} onChange={(event) => setAssignPermissionGranted(event.target.checked)} disabled={!canAssignUserPermission || !selectedUserId} /><span className="form-check-label">Được cấp (bỏ chọn để revoke)</span></label>
            <button className="btn btn-outline-dark" type="submit" disabled={!canAssignUserPermission || !selectedUserId || !assignPermissionId || busyAction === 'user-permission'}>{busyAction === 'user-permission' ? 'Đang lưu...' : 'Lưu permission user'}</button>
          </form>
        </div>

        {userPermissions.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Permission</th><th>Trạng thái</th><th>User permission ID</th></tr></thead><tbody>{userPermissions.map((item) => <tr key={item.id ?? `${item.permissionId}-${item.isGranted}`}><td>{item.permissionCode ?? item.permission?.permissionCode ?? permissions.find((permission) => String(permission.id) === String(permissionId(item)))?.permissionCode ?? `#${permissionId(item)}`}</td><td><span className="status-pill">{item.isGranted === false ? 'REVOKED' : 'GRANTED'}</span></td><td>{item.id ?? '-'}</td></tr>)}</tbody></table></div> : <p className="muted mb-0">Tài khoản này chưa có permission override trực tiếp.</p>}
      </section>
    </section>
  )
}

export default AccessManagementPage
