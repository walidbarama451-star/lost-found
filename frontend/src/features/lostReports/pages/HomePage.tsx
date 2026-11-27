import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ImageUploader } from '@/features/items/components/ImageUploader';
import { ItemCard } from '@/features/items/components/ItemCard';
import {
  emptyLostReportValues,
  lostReportSchema,
  type LostReportFormValues,
} from '@/features/lostReports/lostReportSchemas';
import { createLostReport } from '@/features/lostReports/lostReportsService';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import type { LostReport } from '@/shared/api/types';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/States';
import { errorClass, fieldClass, inputClass, labelClass } from '@/shared/ui/formStyles';

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

const HomePage = (): ReactNode => {
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
      <div className="space-y-10">
        <section className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Private photo matching
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Lost something?{' '}
            <span className="text-ink-muted">Find it with a photo.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Found items stay private on Found It. Sign in, upload a photo of your lost
            belonging, and we&apos;ll reveal anything that looks like a match.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/login" className={buttonClasses('primary', 'md')}>
              Sign in to search
            </Link>
            <Link to="/register" className={buttonClasses('secondary', 'md')}>
              Create account
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            No public browsing. Your photos and claims stay between you and the finder.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="How Found It works">
          {[
            ['01', 'Upload a photo', 'Show us the item you lost — or something that looks close.'],
            ['02', 'We compare the photos', 'Your search is checked against every private found-item listing.'],
            ['03', 'Claim it privately', 'Prove it’s yours to the finder and arrange the handover.'],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <span className="text-xs font-bold text-accent-700 tabular">{number}</span>
              <h2 className="mt-2 text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Private by design
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">Ready to find what you lost?</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Create an account and start with a photo. Found items stay hidden until they match.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/register" className={buttonClasses('primary', 'md')}>
              Create account
            </Link>
            <Link to="/login" className={buttonClasses('secondary', 'md')}>
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const errorFor = (field: string) => fieldErrors[field];

  if (report) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
              Search results
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight text-ink">
              Matches for “{report.title}”
              {report.matches.length > 0 ? (
                <span className="inline-flex items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-sm font-semibold text-accent-700 ring-1 ring-accent-300 tabular">
                  {report.matches.length}
                </span>
              ) : null}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Saved automatically — find them again under{' '}
              <Link to="/lost-reports" className="font-medium text-accent-600 hover:text-accent-700">
                My lost reports
              </Link>
              .
            </p>
          </div>
          <Button variant="secondary" onClick={() => setReport(null)}>
            New search
          </Button>
        </div>

        {report.matches.length === 0 ? (
          <EmptyState
            icon={<SearchX size={20} />}
            title="No matching found items yet"
            description="Nothing that looks like your item has been reported. Your search is saved — check “My lost reports” and re-run it later, or try a different photo."
            action={
              <Link to="/lost-reports" className={buttonClasses('secondary', 'sm')}>
                My lost reports
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className={
                        match.method === 'photo'
                          ? 'inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success/40'
                          : 'inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning ring-1 ring-warning/40'
                      }
                      title={
                        match.method === 'photo'
                          ? 'Photo similarity to your lost item'
                          : 'Matched by title'
                      }
                    >
                      {percentage(match.score)} similar
                    </span>
                    <Link
                      to={`/items/${match.itemId}`}
                      className={buttonClasses('primary', 'sm')}
                    >
                      Check if it&apos;s mine
                    </Link>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Photo search</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Lost something? <span className="text-ink-muted">Let&apos;s find it.</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Upload a photo of your lost item — or something that looks close — and we&apos;ll show
          you every private found-item listing that looks like it.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-medium text-ink">What did you lose?</h2>
              <p className="mt-1 text-xs text-ink-faint">
                A short title helps us match the wording too.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-300 bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
              <Sparkles size={13} aria-hidden />
              AI photo match
            </span>
          </div>

          {formError ? (
            <p
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="lost-title">
              Item title
            </label>
            <input
              id="lost-title"
              className={inputClass}
              type="text"
              placeholder="e.g. Black leather wallet with a silver clasp"
              value={values.title}
              onChange={(event) => set({ title: event.target.value })}
              aria-invalid={Boolean(errorFor('title'))}
              maxLength={120}
              required
            />
            {errorFor('title') ? <p className={errorClass}>{errorFor('title')}</p> : null}
          </div>

          <ImageUploader files={files} onFilesChange={setFiles} maxImages={3} />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={submitting}>
              <Search size={16} aria-hidden />
              {submitting ? 'Searching…' : 'Search with this photo'}
            </Button>
            <Link to="/lost-reports" className={buttonClasses('secondary', 'md')}>
              My lost reports
            </Link>
          </div>
        </form>
      </div>

      <p className="text-xs text-ink-faint">
        Found items are hidden from everyone until a search matches them.
      </p>
    </div>
  );
};

export default HomePage;
