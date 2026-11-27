import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { loginSchema, type LoginInput } from '@/features/auth/authSchemas';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/Button';
import { errorClass, fieldClass, inputClass, labelClass } from '@/shared/ui/formStyles';

const LoginPage = (): ReactNode => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [values, setValues] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<LoginInput>) => {
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

    const check = validateWith<LoginInput>(loginSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(check.data);
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
        <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Welcome back</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Pick up where you left off and keep your claims private.
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
            <label className={labelClass} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={inputClass}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set({ email: event.target.value })}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'login-email-error' : undefined}
              required
            />
            {errorFor('email') ? (
              <p className={errorClass} id="login-email-error">
                {errorFor('email')}
              </p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              aria-invalid={Boolean(errorFor('password'))}
              aria-describedby={errorFor('password') ? 'login-password-error' : undefined}
              required
            />
            {errorFor('password') ? (
              <p className={errorClass} id="login-password-error">
                {errorFor('password')}
              </p>
            ) : null}
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-ink-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-accent-600 hover:text-accent-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
