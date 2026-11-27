import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { claimSchema, type ClaimFormValues } from '@/features/claims/claimSchemas';
import { submitClaim } from '@/features/claims/claimsService';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { errorClass, fieldClass, hintClass, labelClass, textareaClass } from '@/shared/ui/formStyles';

interface ClaimFormProps {
  itemId: string;
  onSubmitted?: () => void;
}

export const ClaimForm = ({ itemId, onSubmitted }: ClaimFormProps): ReactNode => {
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
      <div className="rounded-xl border border-success/30 bg-success/10 p-5">
        <p className="text-sm text-ink" role="status">
          Claim submitted. The listing owner has been notified and can review your private
          message.
        </p>
        <Link to="/" className={buttonClasses('secondary', 'sm', 'mt-4')}>
          Search for a lost item
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className="text-lg font-medium text-ink">I think this is mine</h2>
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-sm leading-relaxed text-accent-900">
          <Lock size={15} className="mt-0.5 shrink-0 text-accent-600" aria-hidden />
          <p>
            Your message is only visible to the listing owner. Never post serial numbers,
            documents or contact details on the public listing itself.
          </p>
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <div className={fieldClass}>
        <label className={labelClass} htmlFor="claim-message">
          How can you identify this item?
        </label>
        <textarea
          id="claim-message"
          className={textareaClass}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          placeholder="Describe a unique mark, contents or detail only the real owner would know…"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={
            fieldError ? 'claim-message-error claim-privacy-hint' : 'claim-privacy-hint'
          }
          minLength={10}
          maxLength={2000}
          required
        />
        {fieldError ? (
          <p className={errorClass} id="claim-message-error">
            {fieldError}
          </p>
        ) : null}
        <p className={hintClass} id="claim-privacy-hint">
          Your message is only visible to the listing owner.
        </p>
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? 'Submitting…' : 'Submit claim'}
      </Button>
    </form>
  );
};
