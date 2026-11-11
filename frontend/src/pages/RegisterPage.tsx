import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { registerSchema, type RegisterInput } from '../features/auth/authSchemas';
import { toDisplayError, validateWith } from '../lib/validation';
import './AuthForms.css';

export default function RegisterPage() {
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
    <div className="auth-forms">
      <div className="card auth-forms__card">
        <h1>Create your account</h1>
        <p className="muted">Publish found items or claim something that is yours.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="inline-alert inline-alert-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor="register-username">
              Username
            </label>
            <input
              id="register-username"
              className="form-control"
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
              <p className="form-error" id="register-username-error">
                {errorFor('username')}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-discord-username">
              Discord username <span className="muted">(optional)</span>
            </label>
            <input
              id="register-discord-username"
              className="form-control"
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
              <p className="form-error" id="register-discord-username-error">
                {errorFor('discordUsername')}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="form-control"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set({ email: event.target.value })}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'register-email-error' : undefined}
              required
            />
            {errorFor('email') ? (
              <p className="form-error" id="register-email-error">
                {errorFor('email')}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              aria-invalid={Boolean(errorFor('password'))}
              aria-describedby={errorFor('password') ? 'register-password-error' : 'register-password-hint'}
              minLength={8}
              maxLength={128}
              required
            />
            <p className="form-hint" id="register-password-hint">
              At least 8 characters.
            </p>
            {errorFor('password') ? (
              <p className="form-error" id="register-password-error">
                {errorFor('password')}
              </p>
            ) : null}
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-forms__switch muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
