import { Link } from 'react-router-dom';
import { formatDateTime, notificationLabel } from '../lib/format';
import type { AppNotification } from '../types';
import './NotificationList.css';

interface NotificationListProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  busyId?: string | null;
}

export default function NotificationList({ notifications, onMarkRead, busyId }: NotificationListProps) {
  return (
    <ul className="notification-list">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={`notification-list__item${notification.read ? '' : ' notification-list__item--unread'}`}
        >
          <div className="notification-list__head">
            <span className="notification-list__type">
              {notificationLabel(notification.type)}
            </span>
            <time className="muted" dateTime={notification.createdAt}>
              {formatDateTime(notification.createdAt)}
            </time>
          </div>
          <p className="notification-list__title">{notification.title}</p>
          <p className="notification-list__message">{notification.message}</p>
          <div className="notification-list__actions">
            {notification.relatedItem ? (
              <Link
                className="btn btn-ghost btn-sm"
                to={`/items/${notification.relatedItem}`}
              >
                View listing
              </Link>
            ) : null}
            {!notification.read ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onMarkRead(notification.id)}
                disabled={busyId === notification.id}
              >
                {busyId === notification.id ? 'Marking…' : 'Mark as read'}
              </button>
            ) : (
              <span className="notification-list__read-flag muted">Read</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
