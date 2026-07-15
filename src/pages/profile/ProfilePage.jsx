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
            />
          </label>

          <label className="form-label">
            Phone
            <input
              className="form-control"
              name="phone"
              value={form.phone}
              onChange={updateProfileField}
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
            />
          </label>

          <label className="form-label">
            New password
            <input
              className="form-control"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={updatePasswordField}
            />
          </label>

          <label className="form-label">
            Confirm password
            <input
              className="form-control"
              name="confirmNewPassword"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={updatePasswordField}
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
