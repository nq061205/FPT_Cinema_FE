import { useCallback, useEffect, useState } from "react";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { formatLabel } from "../../lib/formatters.js";
import { profileService } from "../../services/user.service.js";

function ProfilePage() {
  const loadProfile = useCallback(() => profileService.get(), []);
  const { data: profile, error, loading, setData } = useAsync(loadProfile);
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [actionError, setActionError] = useState(null);
  const [message, setMessage] = useState("");

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
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setActionError(null);
    setMessage("");

    if (!form.fullName.trim() || !/^[0-9]{9,15}$/.test(form.phone.trim())) {
      setActionError(new Error('Full name is required and phone must contain 9 to 15 digits.'))
      return
    }

    try {
      const updated = await profileService.update(form);
      setData(updated);
      setMessage("Profile saved");
    } catch (err) {
      setActionError(err);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setActionError(null);
    setMessage("");

    if (passwordForm.newPassword.length < 8) {
      setActionError(new Error('New password must contain at least 8 characters.'))
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setActionError(new Error('New password and confirmation do not match.'))
      return
    }

    try {
      await profileService.changePassword(passwordForm);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setMessage("Password changed");
    } catch (err) {
      setActionError(err);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Read and edit the authenticated user profile."
      />

      <ErrorMessage error={error || actionError} />
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleProfileSubmit}>
          <div className="panel-header">
            <h2>Details</h2>
            {loading ? <span className="status-pill">loading</span> : null}
          </div>

          <label className="form-label">
            Full name
            <input
              className="form-control"
              name="fullName"
              value={form.fullName}
              onChange={updateProfileField}
              required
              maxLength="100"
            />
          </label>

          <label className="form-label">
            Phone
            <input
              className="form-control"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]{9,15}"
              title="Phone must contain 9 to 15 digits"
              value={form.phone}
              onChange={updateProfileField}
              required
            />
          </label>

          <dl className="detail-list">
            <dt>Email</dt>
            <dd>{profile?.email ?? "-"}</dd>
            <dt>Level</dt>
            <dd>{formatLabel(profile?.membershipLevel)}</dd>
            <dt>Reward points</dt>
            <dd>{profile?.rewardPoints ?? 0}</dd>
          </dl>

          <button className="btn btn-danger" type="submit">
            Save profile
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

          <button className="btn btn-outline-dark" type="submit">
            Change password
          </button>
        </form>
      </div>
    </section>
  );
}

export default ProfilePage;