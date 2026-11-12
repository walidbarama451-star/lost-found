import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ImageUploader from '../components/ImageUploader';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../features/auth/AuthContext';
import { emptyLostReportValues, lostReportSchema, type LostReportFormValues } from '../features/lostReports/lostReportSchemas';
import { createLostReport } from '../features/lostReports/lostReportsService';
import { categoryLabel } from '../lib/format';
import { toDisplayError, validateWith } from '../lib/validation';
import type { LostReport } from '../types';
import './HomePage.css';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

/** Home page: the lost-item photo search. Found items are never browsable. */
export default function HomePage() {
  const { user } = useAuth();
  const [values, setValues] = useState<LostReportFormValues>({
    ...emptyLostReportValues,
    dateLost: todayIso(),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<LostReport | null>(null);

  const set = (patch: Partial<LostReportFormValues>) => {
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

    const check = validateWith<LostReportFormValues>(lostReportSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }
    if (files.length === 0) {
      setFormError('Add at least one photo of your lost item (a similar photo works too).');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', check.data.title);
      form.append('description', check.data.description);
      form.append('category', check.data.category);
      form.append('dateLost', check.data.dateLost);
      for (const file of files) form.append('images', file);
      const created = await createLostReport(form);
      setReport(created);
      setFiles([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const display = toDisplayError(error);
      setFormError(display.message);
      setFieldErrors((prev) => ({ ...prev, ...display.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="home-page">
        <section className="home-page__hero">
          <h1>Lost something? Search for it with a photo.</h1>
          <p className="muted">
            Found items stay private on Lost &amp; Found. Sign in, describe your lost belonging and
            upload a photo of it (or something that looks close) — we will show you any found item
            that matches, so you can check whether it is yours.
          </p>
          <div className="home-page__cta">
            <Link className="btn btn-primary" to="/login">
              Sign in to search
            </Link>
            <Link className="btn btn-secondary" to="/register">
              Create account
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const errorFor = (field: string) => fieldErrors[field];

  return (
    <div className="home-page">
      <section className="home-page__hero">
        <h1>Lost something? Search for it with a photo.</h1>
        <p className="muted">
          Upload a photo of your lost item (or something that looks close), tell us what it is, and
          we will show you every found item that looks like it. Found items are hidden from
          everyone until a search matches them.
        </p>
      </section>

      {report ? (
        <section className="home-page__results" aria-label="Search results">
          <div className="home-page__results-head">
            <h2>
              Matches for “{report.title}”{report.matches.length > 0 ? ` (${report.matches.length})` : ''}
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setReport(null)}
            >
              Search again
            </button>
          </div>

          {report.matches.length === 0 ? (
            <EmptyState
              title="No matching found items yet"
              message="Nothing that looks like your item has been reported. Your search is saved — check “My lost reports” and re-run it later, or try a different photo."
              action={
                <Link className="btn btn-secondary btn-sm" to="/lost-reports">
                  My lost reports
                </Link>
              }
            />
          ) : (
            <div className="home-page__results-grid">
              {report.matches.map((match) => (
                <ItemCard
                  key={`${match.itemId}-${match.score}`}
                  item={{
                    id: match.itemId,
                    title: match.title,
                    description: '',
                    category: match.category,
                    images: [{ url: match.image ?? '' }],
                    dateFound: match.dateFound,
                    status: match.status,
                    createdAt: match.dateFound,
                    updatedAt: match.dateFound,
                    owner: { id: '', username: '' },
                  }}
                  actions={
                    <>
                      <span
                        className={`home-page__score home-page__score--${match.method}`}
                        title={
                          match.method === 'photo'
                            ? 'Photo similarity to your lost item'
                            : 'Matched by description'
                        }
                      >
                        {percentage(match.score)} similar
                      </span>
                      <Link className="btn btn-primary btn-sm" to={`/items/${match.itemId}`}>
                        Check if it&apos;s mine
                      </Link>
                    </>
                  }
                />
              ))}
            </div>
          )}
          <p className="muted home-page__results-note">
            Matches are saved automatically — find them again under{' '}
            <Link to="/lost-reports">My lost reports</Link>.
          </p>
        </section>
      ) : (
        <section className="home-page__search card" aria-label="Lost item search">
          <form onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="inline-alert inline-alert-error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="form-field">
              <label className="form-label" htmlFor="lost-title">
                What did you lose?
              </label>
              <input
                id="lost-title"
                className="form-control"
                type="text"
                value={values.title}
                onChange={(event) => set({ title: event.target.value })}
                aria-invalid={Boolean(errorFor('title'))}
                maxLength={120}
                required
              />
              {errorFor('title') ? <p className="form-error">{errorFor('title')}</p> : null}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="lost-description">
                Describe it — details help the match
              </label>
              <textarea
                id="lost-description"
                className="form-control"
                value={values.description}
                onChange={(event) => set({ description: event.target.value })}
                aria-invalid={Boolean(errorFor('description'))}
                placeholder="Colour, brand, distinguishing marks, what was inside…"
                required
              />
              {errorFor('description') ? (
                <p className="form-error">{errorFor('description')}</p>
              ) : null}
            </div>

            <div className="home-page__row">
              <div className="form-field">
                <label className="form-label" htmlFor="lost-category">
                  Category
                </label>
                <select
                  id="lost-category"
                  className="form-control"
                  value={values.category}
                  onChange={(event) => set({ category: event.target.value })}
                  aria-invalid={Boolean(errorFor('category'))}
                  required
                >
                  <option value="">Choose a category…</option>
                  {(
                    [
                      'ELECTRONICS',
                      'DOCUMENTS',
                      'KEYS',
                      'BAGS',
                      'ACCESSORIES',
                      'CLOTHING',
                      'JEWELRY',
                      'PETS',
                      'OTHER',
                    ] as const
                  ).map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
                {errorFor('category') ? <p className="form-error">{errorFor('category')}</p> : null}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="lost-date">
                  Date lost
                </label>
                <input
                  id="lost-date"
                  className="form-control"
                  type="date"
                  value={values.dateLost}
                  max={todayIso()}
                  onChange={(event) => set({ dateLost: event.target.value })}
                  aria-invalid={Boolean(errorFor('dateLost'))}
                  required
                />
                {errorFor('dateLost') ? <p className="form-error">{errorFor('dateLost')}</p> : null}
              </div>
            </div>

            <ImageUploader files={files} onFilesChange={setFiles} maxImages={3} />

            <div className="home-page__actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Searching…' : 'Search with this photo'}
              </button>
              <Link className="btn btn-secondary" to="/lost-reports">
                My lost reports
              </Link>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
