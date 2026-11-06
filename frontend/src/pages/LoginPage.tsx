import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { loginSchema, type LoginInput } from '../features/auth/authSchemas';
import { toDisplayError, validateWith } from '../lib/validation';
import './AuthForms.css';

export default function LoginPage() {
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
    <div className="auth-forms">
      <div className="card auth-forms__card">
        <h1>Sign in</h1>
        <p className="muted">Welcome back.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="inline-alert inline-alert-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="form-control"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set({ email: event.target.value })}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'login-email-error' : undefined}
              required
            />
            {errorFor('email') ? (
              <p className="form-error" id="login-email-error">
                {errorFor('email')}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              aria-invalid={Boolean(errorFor('password'))}
              aria-describedby={errorFor('password') ? 'login-password-error' : undefined}
              required
            />
            {errorFor('password') ? (
              <p className="form-error" id="login-password-error">
                {errorFor('password')}
              </p>
            ) : null}
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-forms__switch muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
