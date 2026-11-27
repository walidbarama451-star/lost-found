import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { registerSchema, type RegisterInput } from '@/features/auth/authSchemas';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/Button';
import { errorClass, fieldClass, hintClass, inputClass, labelClass } from '@/shared/ui/formStyles';

const RegisterPage = (): ReactNode => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [values, setValues] = useState<RegisterInput>({
    username: '',
    discordUsername: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<RegisterInput>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    const touched = Object.keys(patch)[0];
    if (touched && fieldErrors[touched]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[touched];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const check = validateWith<RegisterInput>(registerSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(check.data);
      navigate(from, { replace: true });
    } catch (error) {
      const display = toDisplayError(error);
      setFormError(display.message);
      setFieldErrors((prev) => ({ ...prev, ...display.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (field: string) => fieldErrors[field];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Get started</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Publish found items or claim something that is yours.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="register-username">
              Username
            </label>
            <input
              id="register-username"
              className={inputClass}
              type="text"
              autoComplete="username"
              value={values.username}
              onChange={(event) => set({ username: event.target.value })}
              aria-invalid={Boolean(errorFor('username'))}
              aria-describedby={errorFor('username') ? 'register-username-error' : undefined}
              minLength={3}
              maxLength={30}
              required
            />
            {errorFor('username') ? (
              <p className={errorClass} id="register-username-error">
                {errorFor('username')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="register-discord-username">
              Discord username <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="register-discord-username"
              className={inputClass}
              type="text"
              autoComplete="off"
              value={values.discordUsername}
              onChange={(event) => set({ discordUsername: event.target.value })}
              aria-invalid={Boolean(errorFor('discordUsername'))}
              aria-describedby={
                errorFor('discordUsername') ? 'register-discord-username-error' : undefined
              }
              minLength={2}
              maxLength={32}
            />
            {errorFor('discordUsername') ? (
              <p className={errorClass} id="register-discord-username-error">
                {errorFor('discordUsername')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className={inputClass}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set({ email: event.target.value })}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'register-email-error' : undefined}
              required
            />
            {errorFor('email') ? (
              <p className={errorClass} id="register-email-error">
                {errorFor('email')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              aria-invalid={Boolean(errorFor('password'))}
              aria-describedby={
                errorFor('password') ? 'register-password-error' : 'register-password-hint'
              }
              minLength={8}
              maxLength={128}
              required
            />
            <p className={hintClass} id="register-password-hint">
              At least 8 characters.
            </p>
            {errorFor('password') ? (
              <p className={errorClass} id="register-password-error">
                {errorFor('password')}
              </p>
            ) : null}
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
