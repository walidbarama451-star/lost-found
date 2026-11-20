import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../features/auth/AuthContext';
import { updateProfile } from '../features/profile/profileService';
import { profileSchema, type ProfileFormValues } from '../features/profile/profileSchema';
import { formatDateTime } from '../lib/format';
import { toDisplayError, validateWith } from '../lib/validation';
import './ProfilePage.css';

const EMPTY_VALUES: ProfileFormValues = {
  username: '',
  email: '',
  phone: '',
  discordUsername: '',
};

export default function ProfilePage() {
  const { user, status, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<ProfileFormValues>(EMPTY_VALUES);
  const [initialized, setInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!initialized && user) {
    setInitialized(true);
    setValues({
      username: user.username,
      email: user.email,
      phone: user.phone ?? '',
      discordUsername: user.discordUsername ?? '',
    });
  }

  if (status === 'loading') return <LoadingState label="Loading your profile…" />;
  if (!user) return <ErrorState message="You need to sign in to view your profile." />;

  const setField = (field: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const check = validateWith<ProfileFormValues>(profileSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const patch: Partial<ProfileFormValues> = {};
      if (check.data.username !== user.username) patch.username = check.data.username;
      if (check.data.email !== user.email) patch.email = check.data.email;
      if (check.data.phone !== (user.phone ?? '')) patch.phone = check.data.phone;
      if (check.data.discordUsername !== (user.discordUsername ?? '')) {
        patch.discordUsername = check.data.discordUsername;
      }

      if (Object.keys(patch).length === 0) {
        setSuccess('No changes to save.');
        return;
      }

      const updated = await updateProfile(patch);
      updateUser(updated);
      setSuccess('Profile updated.');
    } catch (caught) {
      const display = toDisplayError(caught);
      setFieldErrors(display.fieldErrors);
      setFormError(display.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <p className="muted">Member since {formatDateTime(user.createdAt)}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleLogout()}
          disabled={saving}
        >
          Sign out
        </button>
      </div>

      <div className="profile-page__grid">
        <form className="card profile-page__form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <h2>Account details</h2>

          {formError ? (
            <div className="inline-alert inline-alert-error" role="alert">
              {formError}
            </div>
          ) : null}
          {success ? (
            <div className="inline-alert inline-alert-success" role="status">
              {success}
            </div>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              className="form-control"
              type="text"
              value={values.username}
              onChange={(event) => setField('username', event.target.value)}
              aria-invalid={fieldErrors.username ? 'true' : undefined}
              aria-describedby={fieldErrors.username ? 'profile-username-error' : undefined}
              autoComplete="username"
            />
            {fieldErrors.username ? (
              <span className="form-error" id="profile-username-error">
                {fieldErrors.username}
              </span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="form-control"
              type="email"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <span className="form-error" id="profile-email-error">
                {fieldErrors.email}
              </span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-phone">
              Phone <span className="muted">(optional)</span>
            </label>
            <input
              id="profile-phone"
              className="form-control"
              type="tel"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              aria-invalid={fieldErrors.phone ? 'true' : undefined}
              aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
              autoComplete="tel"
            />
            {fieldErrors.phone ? (
              <span className="form-error" id="profile-phone-error">
                {fieldErrors.phone}
              </span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-discord">
              Discord username <span className="muted">(optional)</span>
            </label>
            <input
              id="profile-discord"
              className="form-control"
              type="text"
              value={values.discordUsername}
              onChange={(event) => setField('discordUsername', event.target.value)}
              aria-invalid={fieldErrors.discordUsername ? 'true' : undefined}
              aria-describedby={fieldErrors.discordUsername ? 'profile-discord-error' : undefined}
              placeholder="yourname"
            />
            {fieldErrors.discordUsername ? (
              <span className="form-error" id="profile-discord-error">
                {fieldErrors.discordUsername}
              </span>
            ) : null}
          </div>

          <div className="row profile-page__submit">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <aside className="card profile-page__aside">
          <h2>Good to know</h2>
          <ul className="profile-page__tips">
            <li>Your email and phone are only shared with you. Your Discord username is visible to other signed-in users so they can reach you there.</li>
            <li>Keep proof details (serial numbers, unique markings) out of public listings.</li>
            <li>You can review every claim you’ve submitted from the Claims page.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
