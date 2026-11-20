import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ItemCard from '../components/ItemCard';
import LoadingState from '../components/LoadingState';
import { deleteLostReport, listMyReports, searchLostReport } from '../features/lostReports/lostReportsService';
import { resolveImageUrl } from '../lib/api';
import { useApi } from '../lib/useApi';
import { toDisplayError } from '../lib/validation';
import { formatDate, formatDateTime } from '../lib/format';
import type { LostReport } from '../types';
import './MyLostReportsPage.css';

const percentage = (score: number): string => `${Math.round(score * 100)}%`;

export default function MyLostReportsPage() {
  const reports = useApi(() => listMyReports({ page: 1, limit: 24 }), []);
  const [busyReport, setBusyReport] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (reportId: string, action: () => Promise<unknown>) => {
    setActionError(null);
    setBusyReport(reportId);
    try {
      await action();
      await reports.reload();
    } catch (error) {
      setActionError(toDisplayError(error).message);
    } finally {
      setBusyReport(null);
    }
  };

  const closeReport = (report: LostReport) =>
    runAction(report.id, () =>
      import('../features/lostReports/lostReportsService').then((service) =>
        service.updateLostReport(report.id, {
          status: report.status === 'OPEN' ? 'CLOSED' : 'OPEN',
        }),
      ),
    );

  const removeReport = (report: LostReport) =>
    runAction(report.id, () => deleteLostReport(report.id));

  return (
    <div className="lost-reports">
      <div className="page-header">
        <div>
          <h1>My lost reports</h1>
          <p className="muted">
            Every photo search you have run. Re-run a search to catch found items that were
            published after you last looked.
          </p>
        </div>
        <Link className="btn btn-primary" to="/">
          + New search
        </Link>
      </div>

      {actionError ? (
        <p className="inline-alert inline-alert-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {reports.loading ? <LoadingState label="Loading your searches…" /> : null}
      {!reports.loading && reports.error ? (
        <ErrorState message={reports.error} onRetry={reports.reload} />
      ) : null}
      {!reports.loading && !reports.error && reports.data && reports.data.reports.length === 0 ? (
        <EmptyState
          title="No lost reports yet"
          message="Upload a photo of something you lost and we will look for found items that look like it."
          action={
            <Link className="btn btn-primary btn-sm" to="/">
              Search for a lost item
            </Link>
          }
        />
      ) : null}

      {!reports.loading && !reports.error && reports.data
        ? reports.data.reports.map((report) => (
            <section key={report.id} className="lost-reports__card card">
              <header className="lost-reports__head">
                <div className="lost-reports__summary">
                  <h2>{report.title}</h2>
                  <p className="muted">
                    Reported {formatDate(report.createdAt)} ·{' '}
                    {report.status === 'OPEN' ? 'Open' : 'Closed'}
                  </p>
                </div>
                <div className="lost-reports__actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyReport === report.id}
                    onClick={() => void runAction(report.id, () => searchLostReport(report.id))}
                  >
                    {busyReport === report.id ? 'Searching…' : 'Search again'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyReport === report.id}
                    onClick={() => void closeReport(report)}
                  >
                    {report.status === 'OPEN' ? 'Close report' : 'Reopen'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={busyReport === report.id}
                    onClick={() => void removeReport(report)}
                  >
                    Delete
                  </button>
                </div>
              </header>

              {report.images.length > 0 ? (
                <div className="lost-reports__photos">
                  {report.images.map((image) => (
                    <img
                      key={image.url}
                      className="lost-reports__photo"
                      src={resolveImageUrl(image.url) ?? undefined}
                      alt={`Photo of the lost ${report.title}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}

              <p className="muted lost-reports__last-search">
                {report.lastSearchedAt
                  ? `Last searched ${formatDateTime(report.lastSearchedAt)}`
                  : 'Not searched yet'}
              </p>

              {report.matches.length === 0 ? (
                <p className="muted">No matches yet — try again later or with a different photo.</p>
              ) : (
                <div className="lost-reports__matches">
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
                            className={`lost-reports__score lost-reports__score--${match.method}`}
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
          ))
        : null}
    </div>
  );
}
