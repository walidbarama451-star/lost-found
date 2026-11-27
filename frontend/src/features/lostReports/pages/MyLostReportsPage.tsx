import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  FileSearch,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { ItemCard } from '@/features/items/components/ItemCard';
import {
  deleteLostReport,
  listMyReports,
  searchLostReport,
  updateLostReport,
} from '@/features/lostReports/lostReportsService';
import { resolveImageUrl } from '@/shared/api/client';
import type { LostReport } from '@/shared/api/types';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { toDisplayError } from '@/shared/lib/validation';
import { useApi } from '@/shared/lib/useApi';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/States';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { useToast } from '@/shared/ui/toastContext';

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

const MyLostReportsPage = (): ReactNode => {
  const pushToast = useToast();
  const [busyReport, setBusyReport] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LostReport | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reports = useApi(() => listMyReports({ page: 1, limit: 24 }), []);

  const runAction = async (
    report: LostReport,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setActionError(null);
    setBusyReport(report.id);
    try {
      await action();
      setPendingDelete(null);
      pushToast(successMessage, 'success');
      reports.reload();
    } catch (error) {
      setActionError(toDisplayError(error).message);
    } finally {
      setBusyReport(null);
    }
  };

  const toggleReport = (report: LostReport) =>
    runAction(
      report,
      () =>
        updateLostReport(report.id, {
          status: report.status === 'OPEN' ? 'CLOSED' : 'OPEN',
        }),
      report.status === 'OPEN' ? 'Report closed.' : 'Report reopened.',
    );

  const deleteReport = (report: LostReport) =>
    runAction(report, () => deleteLostReport(report.id), 'Report deleted.');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Photo searches
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">My lost reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Every photo search you have run. Re-run a search to catch found items that were
            published after you last looked.
          </p>
        </div>
        <Link to="/" className={buttonClasses('primary', 'md')}>
          <Search size={16} aria-hidden />
          New search
        </Link>
      </div>

      {actionError ? (
        <div
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {reports.loading ? (
        <div className="space-y-3" aria-busy>
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="mt-3 h-4 w-64" />
              <Skeleton className="mt-4 h-16 w-40" />
            </div>
          ))}
        </div>
      ) : null}

      {!reports.loading && reports.error ? (
        <ErrorState message={reports.error} onRetry={reports.reload} />
      ) : null}

      {!reports.loading && !reports.error && reports.data && reports.data.reports.length === 0 ? (
        <EmptyState
          icon={<FileSearch size={20} />}
          title="No lost reports yet"
          description="Upload a photo of something you lost and we will look for found items that look like it."
          action={
            <Link to="/" className={buttonClasses('primary', 'sm')}>
              Search for a lost item
            </Link>
          }
        />
      ) : null}

      {!reports.loading && !reports.error && reports.data
        ? reports.data.reports.map((report) => {
            const busy = busyReport === report.id;
            return (
              <section
                key={report.id}
                className="rounded-xl border border-line bg-surface"
                aria-labelledby={`report-${report.id}-title`}
              >
                <header className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id={`report-${report.id}-title`}
                        className="truncate text-base font-medium text-ink"
                      >
                        {report.title}
                      </h2>
                      <StatusBadge tone={report.status === 'OPEN' ? 'success' : 'neutral'}>
                        {report.status === 'OPEN' ? 'Open' : 'Closed'}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-ink-faint">
                      Reported {formatDate(report.createdAt)} ·{' '}
                      {report.lastSearchedAt
                        ? `Last searched ${formatDateTime(report.lastSearchedAt)}`
                        : 'Not searched yet'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void runAction(report, () => searchLostReport(report.id), 'Search complete.')
                      }
                    >
                      <Search size={14} aria-hidden />
                      {busy ? 'Working…' : 'Search again'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void toggleReport(report)}
                    >
                      {report.status === 'OPEN' ? (
                        <Archive size={14} aria-hidden />
                      ) : (
                        <RotateCcw size={14} aria-hidden />
                      )}
                      {report.status === 'OPEN' ? 'Close report' : 'Reopen'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => setPendingDelete(report)}
                    >
                      <Trash2 size={14} aria-hidden />
                      Delete
                    </Button>
                  </div>
                </header>

                <div className="space-y-4 p-5">
                  {report.images.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {report.images.map((image) => {
                        const src = resolveImageUrl(image.url);
                        if (!src) return null;
                        return (
                          <li key={image.url}>
                            <img
                              className="size-20 rounded-lg border border-line object-cover"
                              src={src}
                              alt={`Photo of the lost ${report.title}`}
                              loading="lazy"
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {report.matches.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      No matches yet — try again later or with a different photo.
                    </p>
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
                                    ? 'inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success/40 tabular'
                                    : 'inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning ring-1 ring-warning/40 tabular'
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
              </section>
            );
          })
        : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this lost report?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” and its saved matches will be removed. This can’t be undone.`
            : ''
        }
        confirmLabel="Delete report"
        danger
        busy={busyReport !== null}
        onConfirm={() => {
          if (pendingDelete) void deleteReport(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default MyLostReportsPage;
