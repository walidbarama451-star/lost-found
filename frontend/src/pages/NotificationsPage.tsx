import { useState } from 'react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import NotificationList from '../components/NotificationList';
import Pagination from '../components/Pagination';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/notifications/notificationsService';
import { toDisplayError } from '../lib/validation';
import { useApi } from '../lib/useApi';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi(() => listNotifications(page, 12), [page]);

  const handleMarkRead = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await markNotificationRead(id);
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    setActionError(null);
    try {
      await markAllNotificationsRead();
      reload();
    } catch (caught) {
      setActionError(toDisplayError(caught).message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="muted">
            {data && data.unreadCount > 0
              ? `You have ${data.unreadCount} unread notification${data.unreadCount === 1 ? '' : 's'}.`
              : 'You’re all caught up.'}
          </p>
        </div>
        {data && data.unreadCount > 0 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void handleMarkAll()}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        ) : null}
      </div>

      {actionError ? (
        <div className="inline-alert inline-alert-error" role="alert">
          {actionError}
        </div>
      ) : null}

      {loading ? <LoadingState label="Loading notifications…" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && data && data.items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          message="Claims on your listings and decisions on your claims will show up here."
        />
      ) : null}
      {!loading && !error && data && data.items.length > 0 ? (
        <>
          <NotificationList
            notifications={data.items}
            onMarkRead={(id) => void handleMarkRead(id)}
            busyId={busyId}
          />
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
            label="Notification page"
          />
        </>
      ) : null}
    </div>
  );
}
