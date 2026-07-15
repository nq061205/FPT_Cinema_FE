import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatLabel } from '../../lib/formatters.js'
import { profileService } from '../../services/user.service.js'

const PHONE_PATTERN = /^[0-9]{9,15}$/

// Khớp với ràng buộc phía backend (RegisterRequest/CreateAccountRequest)
function validateProfile({ fullName, phone }) {
  const errors = {}
  const trimmedName = (fullName ?? '').trim()
  const trimmedPhone = (phone ?? '').trim()

  if (!trimmedName) {
    errors.fullName = 'Vui lòng nhập họ tên.'
  } else if (trimmedName.length > 100) {
    errors.fullName = 'Họ tên tối đa 100 ký tự.'
  }

  if (!trimmedPhone) {
    errors.phone = 'Vui lòng nhập số điện thoại.'
  } else if (!PHONE_PATTERN.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại chỉ gồm 9–15 chữ số.'
  }

  return errors
}

function ProfilePage() {
  const navigate = useNavigate()
  const { endSession } = useAuth()
  const loadProfile = useCallback(() => profileService.get(), [])
  const { data: profile, error, loading, setData } = useAsync(loadProfile)
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setForm({
          fullName: profile.fullName ?? "",
          phone: profile.phone ?? "",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  function updateProfileField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleProfileSubmit(event) {
  event.preventDefault()
  setActionError(null)
  setMessage('')

  const errors = validateProfile(form)
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }
  setFieldErrors({})

  setSavingProfile(true)

  try {
    const updated = await profileService.update({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    })
    setData(updated)
    setMessage('Profile saved')
  } catch (err) {
    setActionError(err)
  } finally {
    setSavingProfile(false)
  }
}

  async function handlePasswordSubmit(event) {
  event.preventDefault()
  setActionError(null)
  setChangingPassword(true)

  try {
    await profileService.changePassword(passwordForm)

    // Lưu thông báo vào sessionStorage thay vì location.state: các route guard
    // (AuthLayout redirect khi còn đăng nhập, ProtectedRoute redirect khi mất
    // token) sẽ ghi đè location.state, nhưng không đụng tới sessionStorage.
    window.sessionStorage.setItem('auth_notice', 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
    // endSession() trước để AuthLayout không đá về trang chủ, rồi mới điều hướng.
    endSession()
    navigate('/login', { replace: true })
  } catch (err) {
    setActionError(err)
    setPasswordForm({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
    setChangingPassword(false)
  }
}

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Read and edit the authenticated user profile."
      />

      {actionError || error ? (
  <ErrorMessage error={error || actionError} />
) : message ? (
  <div className="alert alert-success">{message}</div>
) : null}

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleProfileSubmit}>
          <div className="panel-header">
            <h2>Details</h2>
            {loading ? <span className="status-pill">loading</span> : null}
          </div>

          <label className="form-label">
            Full name
            <input
              className={`form-control${fieldErrors.fullName ? ' is-invalid' : ''}`}
              name="fullName"
              value={form.fullName}
              onChange={updateProfileField}
              maxLength={100}
              aria-invalid={Boolean(fieldErrors.fullName)}
            />
            {fieldErrors.fullName ? <span className="text-danger small">{fieldErrors.fullName}</span> : null}
          </label>

          <label className="form-label">
            Phone
            <input
              className={`form-control${fieldErrors.phone ? ' is-invalid' : ''}`}
              name="phone"
              value={form.phone}
              onChange={updateProfileField}
              inputMode="numeric"
              maxLength={15}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldErrors.phone ? <span className="text-danger small">{fieldErrors.phone}</span> : null}
          </label>

          <dl className="detail-list">
            <dt>Email</dt>
            <dd>{profile?.email ?? "-"}</dd>
            <dt>Level</dt>
            <dd>{formatLabel(profile?.membershipLevel)}</dd>
            <dt>Reward points</dt>
            <dd>{profile?.rewardPoints ?? 0}</dd>
          </dl>

          <button
  className="btn btn-danger d-flex align-items-center justify-content-center gap-2"
  type="submit"
  disabled={savingProfile}
>
  {savingProfile && (
    <span
      className="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
    />
  )}
  {savingProfile ? 'Saving...' : 'Save profile'}
</button>
        </form>

        <form className="panel form-grid" onSubmit={handlePasswordSubmit}>
          <div className="panel-header">
            <h2>Password</h2>
          </div>

          <label className="form-label">
            Current password
            <input
              className="form-control"
              name="oldPassword"
              type="password"
              value={passwordForm.oldPassword}
              onChange={updatePasswordField}
              required
            />
          </label>

          <label className="form-label">
            New password
            <input
              className="form-control"
              name="newPassword"
              type="password"
              minLength="8"
              maxLength="100"
              value={passwordForm.newPassword}
              onChange={updatePasswordField}
              required
            />
          </label>

          <label className="form-label">
            Confirm password
            <input
              className="form-control"
              name="confirmNewPassword"
              type="password"
              minLength="8"
              maxLength="100"
              value={passwordForm.confirmNewPassword}
              onChange={updatePasswordField}
              required
            />
          </label>

          <button
  className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2"
  type="submit"
  disabled={changingPassword}
>
  {changingPassword && (
    <span
      className="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
    />
  )}

  {changingPassword ? 'Changing...' : 'Change password'}
</button>
        </form>
      </div>
    </section>
  );
}

export default ProfilePage;