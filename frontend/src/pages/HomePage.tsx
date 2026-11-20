import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ImageUploader from '../components/ImageUploader';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../features/auth/AuthContext';
import {
  emptyLostReportValues,
  lostReportSchema,
  type LostReportFormValues,
} from '../features/lostReports/lostReportSchemas';
import { createLostReport } from '../features/lostReports/lostReportsService';
import { toDisplayError, validateWith } from '../lib/validation';
import type { LostReport } from '../types';
import './HomePage.css';

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

export default function HomePage() {
  const { user } = useAuth();
  const [values, setValues] = useState<LostReportFormValues>({ ...emptyLostReportValues });
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
        <section className="home-page__hero gradient-canvas">
          <div className="home-page__hero-inner">
            <span className="eyebrow">Private photo matching</span>
            <h1>
              Lost something?
              <span className="home-page__title-soft"> Find it with a photo.</span>
            </h1>
            <p className="home-page__lead">
              Found items stay private on Found It. Sign in, upload a photo of your lost
              belonging, and we&apos;ll reveal anything that looks like a match.
            </p>
            <div className="home-page__cta">
              <Link className="btn btn-primary" to="/login">
                Sign in to search
              </Link>
              <Link className="btn btn-secondary" to="/register">
                Create account
              </Link>
            </div>
            <p className="home-page__privacy">
              No public browsing. Your photos and claims stay between you and the finder.
            </p>
          </div>
        </section>

        <section className="home-page__steps" aria-label="How Found It works">
          <article className="home-page__step card">
            <span className="home-page__step-number">01</span>
            <h2>Upload a photo</h2>
            <p>Show us the item you lost — or something that looks close.</p>
          </article>
          <article className="home-page__step card">
            <span className="home-page__step-number">02</span>
            <h2>We compare the photos</h2>
            <p>Your search is checked against every private found-item listing.</p>
          </article>
          <article className="home-page__step card">
            <span className="home-page__step-number">03</span>
            <h2>Claim it privately</h2>
            <p>Prove it&apos;s yours to the finder and arrange the handover.</p>
          </article>
        </section>

        <section className="home-page__final-cta gradient-canvas">
          <span className="eyebrow">Private by design</span>
          <h2>Ready to find what you lost?</h2>
          <p>Create an account and start with a photo. Found items stay hidden until they match.</p>
          <div className="home-page__cta">
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

  const errorFor = (field: string) => fieldErrors[field];

  return (
    <div className="home-page">
      {report ? (
        <section className="home-page__results" aria-label="Search results">
          <div className="home-page__results-head">
            <div>
              <span className="eyebrow">Search results</span>
              <h1>
                Matches for “{report.title}”
                {report.matches.length > 0 ? (
                  <span className="home-page__count">{report.matches.length}</span>
                ) : null}
              </h1>
              <p className="muted">
                Saved automatically — find them again under{' '}
                <Link to="/lost-reports">My lost reports</Link>.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReport(null)}
            >
              New search
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
                    images: [{ url: match.image ?? '' }],
                    status: match.status,
                    createdAt: '',
                    updatedAt: '',
                    owner: { id: '', username: '' },
                  }}
                  actions={
                    <>
                      <span
                        className={`home-page__score home-page__score--${match.method}`}
                        title={
                          match.method === 'photo'
                            ? 'Photo similarity to your lost item'
                            : 'Matched by title'
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
        </section>
      ) : (
        <section className="home-page__hero home-page__hero--app gradient-canvas">
          <div className="home-page__hero-inner">
            <span className="eyebrow">Photo search</span>
            <h1>
              Lost something?
              <span className="home-page__title-soft"> Let&apos;s find it.</span>
            </h1>
            <p className="home-page__lead">
              Upload a photo of your lost item — or something that looks close — and we&apos;ll
              show you every private found-item listing that looks like it.
            </p>

            <div className="home-page__prompt card">
              <form onSubmit={handleSubmit} noValidate>
                <div className="home-page__prompt-head">
                  <div>
                    <span className="home-page__prompt-label">What did you lose?</span>
                    <p className="home-page__prompt-hint">
                      A short title helps us match the wording too.
                    </p>
                  </div>
                  <span className="home-page__prompt-badge">AI photo match</span>
                </div>

                {formError ? (
                  <p className="inline-alert inline-alert-error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <div className="form-field home-page__title-field">
                  <label className="form-label" htmlFor="lost-title">
                    Item title
                  </label>
                  <input
                    id="lost-title"
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

                <div className="home-page__actions">
                  <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Searching…' : 'Search with this photo'}
                  </button>
                  <Link className="btn btn-secondary" to="/lost-reports">
                    My lost reports
                  </Link>
                </div>
              </form>
            </div>

            <p className="home-page__privacy">
              Found items are hidden from everyone until a search matches them.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
