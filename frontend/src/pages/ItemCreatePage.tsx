import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import { useAuth } from '../features/auth/AuthContext';
import {
  emptyItemValues,
  itemSchema,
  type ItemFormValues,
} from '../features/items/itemSchemas';
import { createItem } from '../features/items/itemsService';
import { toDisplayError, validateWith } from '../lib/validation';
import './ItemCreatePage.css';

function buildFormData(values: ItemFormValues, files: File[]): FormData {
  const form = new FormData();
  form.append('title', values.title);
  for (const file of files) form.append('images', file);
  return form;
}

export { buildFormData };

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [values, setValues] = useState<ItemFormValues>({ ...emptyItemValues });
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<ItemFormValues>) => {
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

    const check = validateWith<ItemFormValues>(itemSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }
    if (files.length === 0) {
      setFormError('Add at least one photo of the item you found.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const created = await createItem(buildFormData(check.data, files));
      navigate(`/items/${created.id}`, { replace: true });
    } catch (error) {
      const display = toDisplayError(error);
      setFormError(display.message);
      setFieldErrors((prev) => ({ ...prev, ...display.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  const errorFor = (field: string) => fieldErrors[field];

  if (!user) {
    return (
      <div className="item-create-page">
        <section className="item-create-page__hero gradient-canvas">
          <div className="item-create-page__hero-inner">
            <span className="eyebrow">Private photo matching</span>
            <h1>
              Found something?
              <span className="item-create-page__title-soft"> Help it get home.</span>
            </h1>
            <p className="item-create-page__lead">
              Found items stay private on Found It. Sign in to post what you found, and we&apos;ll
              reveal it only when the rightful owner searches for a match.
            </p>
            <div className="item-create-page__cta">
              <Link className="btn btn-primary" to="/login">
                Sign in to post
              </Link>
              <Link className="btn btn-secondary" to="/register">
                Create account
              </Link>
            </div>
            <p className="item-create-page__privacy">
              No public browsing. Your photos and claims stay between you and the claimant.
            </p>
          </div>
        </section>

        <section className="item-create-page__steps" aria-label="How Found It works for finders">
          <article className="item-create-page__step card">
            <span className="item-create-page__step-number">01</span>
            <h2>Take a photo</h2>
            <p>Show what you found — a clear photo helps us match with the owner.</p>
          </article>
          <article className="item-create-page__step card">
            <span className="item-create-page__step-number">02</span>
            <h2>Listing stays private</h2>
            <p>Your item is only revealed to owners whose search photo matches it.</p>
          </article>
          <article className="item-create-page__step card">
            <span className="item-create-page__step-number">03</span>
            <h2>Return it securely</h2>
            <p>Review the owner&apos;s claim and proof before handing it over.</p>
          </article>
        </section>

        <section className="item-create-page__final-cta gradient-canvas">
          <span className="eyebrow">Private by design</span>
          <h2>Ready to help return what you found?</h2>
          <p>Create an account and post a photo. Listings stay hidden until a match is found.</p>
          <div className="item-create-page__cta">
            <Link className="btn btn-primary" to="/register">
              Create account
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="item-create-page">
      <section className="item-create-page__hero item-create-page__hero--app gradient-canvas">
        <div className="item-create-page__hero-inner">
          <span className="eyebrow">Post a found item</span>
          <h1>
            Found something?
            <span className="item-create-page__title-soft"> Help it get home.</span>
          </h1>
          <p className="item-create-page__lead">
            Upload a photo of what you found and add a quick title. We&apos;ll privately
            match it whenever the owner searches.
          </p>

          <div className="item-create-page__prompt card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="item-create-page__prompt-head">
                <div>
                  <span className="item-create-page__prompt-label">What did you find?</span>
                  <p className="item-create-page__prompt-hint">
                    A short title helps owners recognize their item.
                  </p>
                </div>
                <span className="item-create-page__prompt-badge">Private listing</span>
              </div>

              {formError ? (
                <p className="inline-alert inline-alert-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="form-field item-create-page__title-field">
                <label className="form-label" htmlFor="found-title">
                  Item title
                </label>
                <input
                  id="found-title"
                  className="form-control"
                  type="text"
                  placeholder="e.g. Black leather wallet with a silver clasp"
                  value={values.title}
                  onChange={(event) => set({ title: event.target.value })}
                  aria-invalid={Boolean(errorFor('title'))}
                  maxLength={120}
                  required
                />
                {errorFor('title') ? (
                  <p className="form-error">{errorFor('title')}</p>
                ) : null}
              </div>

              <ImageUploader files={files} onFilesChange={setFiles} maxImages={3} />

              <div className="item-create-page__actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Publishing…' : 'Publish listing'}
                </button>
                <Link className="btn btn-secondary" to="/my-items">
                  My found items
                </Link>
              </div>
            </form>
          </div>

          <p className="item-create-page__privacy">
            Found items are hidden from everyone until a search matches them.
          </p>
        </div>
      </section>
    </div>
  );
}
