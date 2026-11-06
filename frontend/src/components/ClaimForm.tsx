import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toDisplayError, validateWith } from '../lib/validation';
import { claimSchema, type ClaimFormValues } from '../features/claims/claimSchemas';
import { submitClaim } from '../features/claims/claimsService';
import './ClaimForm.css';

interface ClaimFormProps {
  itemId: string;
  onSubmitted?: () => void;
}

/**
 * Private claim submission. The privacy reminder is a product requirement
 * (spec 11 + product rule: proof stays off the public listing).
 */
export default function ClaimForm({ itemId, onSubmitted }: ClaimFormProps) {
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const check = validateWith<ClaimFormValues>(claimSchema, { message });
    if (!check.ok) {
      setFieldError(check.fieldErrors.message ?? null);
      setFormError(check.message);
      return;
    }

    setFieldError(null);
    setSubmitting(true);
    try {
      await submitClaim(itemId, check.data.message);
      setDone(true);
      onSubmitted?.();
    } catch (error) {
      const display = toDisplayError(error);
      setFormError(display.message);
      setFieldError(display.fieldErrors.message ?? null);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="claim-form claim-form--done">
        <p className="inline-alert inline-alert-success" role="status">
          Claim submitted. The listing owner has been notified and can review your private
          message.
        </p>
        <Link className="btn btn-secondary btn-sm" to="/claims">
          View my claims
        </Link>
      </div>
    );
  }

  return (
    <form className="claim-form" onSubmit={handleSubmit} noValidate>
      <h2 className="claim-form__title">I think this is mine</h2>

      <p className="claim-form__privacy" role="note">
        🔒 Your message is only visible to the listing owner. Never post serial numbers,
        documents or contact details on the public listing itself.
      </p>

      {formError ? (
        <p className="inline-alert inline-alert-error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="form-field">
        <label className="form-label" htmlFor="claim-message">
          How can you identify this item?
        </label>
        <textarea
          id="claim-message"
          className="form-control"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          placeholder="Describe a unique mark, contents or detail only the real owner would know…"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'claim-message-error claim-privacy-hint' : 'claim-privacy-hint'}
          minLength={10}
          maxLength={2000}
          required
        />
        {fieldError ? (
          <p className="form-error" id="claim-message-error">
            {fieldError}
          </p>
        ) : null}
        <p className="form-hint" id="claim-privacy-hint">
          Your message is only visible to the listing owner.
        </p>
      </div>

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit claim'}
      </button>
    </form>
  );
}
