import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { updateProfile } from '@/features/profile/profileService';
import { profileSchema, type ProfileFormValues } from '@/features/profile/profileSchema';
import { formatDateTime } from '@/shared/lib/format';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/Button';
import { LoadingState } from '@/shared/ui/States';
import { errorClass, fieldClass, inputClass, labelClass } from '@/shared/ui/formStyles';
import { useToast } from '@/shared/ui/toastContext';

const ProfilePage = (): ReactNode => {
  const { user, status, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const pushToast = useToast();

  const [values, setValues] = useState<ProfileFormValues>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    discordUsername: user?.discordUsername ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (status === 'loading') return <LoadingState label="Loading your profile…" />;
  if (!user) return <LoadingState label="Redirecting…" />;

  const setField = (field: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

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
        pushToast('No changes to save.', 'info');
        return;
      }

      const updated = await updateProfile(patch);
      updateUser(updated);
      pushToast('Profile updated.', 'success');
    } catch (caught) {
      const display = toDisplayError(caught);
      setFieldErrors(display.fieldErrors);
      setFormError(display.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const errorFor = (field: string) => fieldErrors[field];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Account</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Your profile</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Member since <span className="tabular">{formatDateTime(user.createdAt)}</span>
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void handleLogout()}
          loading={signingOut}
        >
          <LogOut size={16} aria-hidden />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <form
          className="space-y-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="text-base font-medium text-ink">Account details</h2>

          {formError ? (
            <p
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              className={inputClass}
              type="text"
              value={values.username}
              onChange={(event) => setField('username', event.target.value)}
              aria-invalid={Boolean(errorFor('username'))}
              aria-describedby={errorFor('username') ? 'profile-username-error' : undefined}
              autoComplete="username"
            />
            {errorFor('username') ? (
              <p className={errorClass} id="profile-username-error">
                {errorFor('username')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className={inputClass}
              type="email"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'profile-email-error' : undefined}
              autoComplete="email"
            />
            {errorFor('email') ? (
              <p className={errorClass} id="profile-email-error">
                {errorFor('email')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="profile-phone">
              Phone <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="profile-phone"
              className={inputClass}
              type="tel"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              aria-invalid={Boolean(errorFor('phone'))}
              aria-describedby={errorFor('phone') ? 'profile-phone-error' : undefined}
              autoComplete="tel"
            />
            {errorFor('phone') ? (
              <p className={errorClass} id="profile-phone-error">
                {errorFor('phone')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="profile-discord">
              Discord username <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="profile-discord"
              className={inputClass}
              type="text"
              value={values.discordUsername}
              onChange={(event) => setField('discordUsername', event.target.value)}
              aria-invalid={Boolean(errorFor('discordUsername'))}
              aria-describedby={
                errorFor('discordUsername') ? 'profile-discord-error' : undefined
              }
              placeholder="yourname"
            />
            {errorFor('discordUsername') ? (
              <p className={errorClass} id="profile-discord-error">
                {errorFor('discordUsername')}
              </p>
            ) : null}
          </div>

          <div className="pt-1">
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>

        <aside className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent-600" aria-hidden />
            <h2 className="text-base font-medium text-ink">Good to know</h2>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
            <li>
              Your email and phone are only shared with you. Your Discord username is visible to
              other signed-in users so they can reach you there.
            </li>
            <li>
              Keep proof details (serial numbers, unique markings) out of public listings.
            </li>
            <li>You can review every claim you’ve submitted from the Claims page.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
