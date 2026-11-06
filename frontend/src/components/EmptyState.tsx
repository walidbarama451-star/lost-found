import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  message?: string;
  /** Optional call-to-action rendered under the message. */
  action?: ReactNode;
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {message ? <p className="empty-state__message muted">{message}</p> : null}
      {action}
    </div>
  );
}
