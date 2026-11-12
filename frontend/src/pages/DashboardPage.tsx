import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ItemGrid from '../components/ItemGrid';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../features/auth/AuthContext';
import { listMyItems } from '../features/items/itemsService';
import { listMyClaims } from '../features/claims/claimsService';
import { listMyReports } from '../features/lostReports/lostReportsService';
import { useApi } from '../lib/useApi';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/format';
import { toItemStatus } from '../types';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const items = useApi(() => listMyItems({ page: 1, limit: 6 }), []);
  const reports = useApi(() => listMyReports({ page: 1, limit: 4 }), []);
  const claims = useApi(() => listMyClaims(1, 5), []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Hello, {user?.username ?? 'there'}</h1>
          <p className="muted">Search for lost items, manage your found-item listings and claims.</p>
        </div>
        <div>
          <Link className="btn btn-primary" to="/items/new">
            + Post a found item
          </Link>
          <Link className="btn btn-secondary" to="/">
            Search for a lost item
          </Link>
        </div>
      </div>

      <section className="dashboard__section" aria-label="My recent listings">
        <div className="dashboard__section-head">
          <h2>My recent listings</h2>
          <Link to="/my-items">View all</Link>
        </div>

        {items.loading ? <LoadingState label="Loading your listings…" /> : null}
        {!items.loading && items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : null}
        {!items.loading && !items.error && items.data && items.data.items.length === 0 ? (
          <EmptyState
            title="You haven’t posted anything yet"
            message="Found something? Publish it so its owner can find it."
            action={
              <Link className="btn btn-primary btn-sm" to="/items/new">
                Post a found item
              </Link>
            }
          />
        ) : null}
        {!items.loading && !items.error && items.data && items.data.items.length > 0 ? (
          <ItemGrid items={items.data.items} />
        ) : null}
      </section>

      <section className="dashboard__section" aria-label="My lost reports">
        <div className="dashboard__section-head">
          <h2>My lost reports</h2>
          <Link to="/lost-reports">View all</Link>
        </div>

        {reports.loading ? <LoadingState label="Loading your searches…" /> : null}
        {!reports.loading && reports.error ? (
          <ErrorState message={reports.error} onRetry={reports.reload} />
        ) : null}
        {!reports.loading && !reports.error && reports.data && reports.data.reports.length === 0 ? (
          <EmptyState
            title="You are not searching for anything yet"
            message="Lost something? Upload a photo of it and we will look for matching found items."
            action={
              <Link className="btn btn-primary btn-sm" to="/">
                Search for a lost item
              </Link>
            }
          />
        ) : null}
        {!reports.loading && !reports.error && reports.data && reports.data.reports.length > 0 ? (
          <ul className="dashboard__claim-list">
            {reports.data.reports.map((report) => (
              <li key={report.id} className="dashboard__claim card">
                <div className="dashboard__claim-info">
                  <Link className="dashboard__claim-title" to="/lost-reports">
                    {report.title}
                  </Link>
                  <span className="muted">
                    {report.matches.length} match{report.matches.length === 1 ? '' : 'es'} ·{' '}
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <div className="dashboard__claim-badges">
                  <span className="muted">{report.status === 'OPEN' ? 'Open' : 'Closed'}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="dashboard__section" aria-label="My recent claims">
        <div className="dashboard__section-head">
          <h2>My recent claims</h2>
          <Link to="/claims">View all</Link>
        </div>

        {claims.loading ? <LoadingState label="Loading your claims…" /> : null}
        {!claims.loading && claims.error ? (
          <ErrorState message={claims.error} onRetry={claims.reload} />
        ) : null}
        {!claims.loading && !claims.error && claims.data && claims.data.items.length === 0 ? (
          <EmptyState
            title="No claims submitted"
            message="If you spot your lost item, you can submit a private claim from its listing."
          />
        ) : null}
        {!claims.loading && !claims.error && claims.data && claims.data.items.length > 0 ? (
          <ul className="dashboard__claim-list">
            {claims.data.items.map((claim) => (
              <li key={claim.id} className="dashboard__claim card">
                <div className="dashboard__claim-info">
                  <Link className="dashboard__claim-title" to={`/items/${claim.item.id}`}>
                    {claim.item.title}
                  </Link>
                  <span className="muted">Submitted {formatDate(claim.createdAt)}</span>
                </div>
                <div className="dashboard__claim-badges">
                  <ClaimStatusBadge status={claim.status} />
                  <StatusBadge status={toItemStatus(claim.item.status)} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
