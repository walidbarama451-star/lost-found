import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ItemGrid from '../components/ItemGrid';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../features/auth/AuthContext';
import { listMyItems } from '../features/items/itemsService';
import { listMyClaims } from '../features/claims/claimsService';
import { useApi } from '../lib/useApi';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/format';
import { toItemStatus } from '../types';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const items = useApi(() => listMyItems({ page: 1, limit: 6 }), []);
  const claims = useApi(() => listMyClaims(1, 5), []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Hello, {user?.username ?? 'there'}</h1>
          <p className="muted">Manage your found-item listings and claims.</p>
        </div>
        <Link className="btn btn-primary" to="/items/new">
          + Post a found item
        </Link>
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
