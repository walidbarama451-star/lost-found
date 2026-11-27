import type { CSSProperties, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { buttonClasses } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Backwards-compatible alias used by older call sites. */
  message?: string;
  action?: ReactNode;
}

/** Centered placeholder for "nothing to show yet" — never an error. */
export const EmptyState = ({
  icon,
  title,
  description,
  message,
  action,
}: EmptyStateProps): ReactNode => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
    {icon !== undefined && (
      <span className="flex size-11 items-center justify-center rounded-full bg-overlay text-ink-muted">
        {icon}
      </span>
    )}
    <h2 className="text-base font-medium">{title}</h2>
    {(description ?? message) !== undefined && (
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">{description ?? message}</p>
    )}
    {action !== undefined && <div className="mt-2">{action}</div>}
  </div>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Backwards-compatible alias used by older call sites. */
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
}

/** Failure panel with an explicit retry affordance. */
export const ErrorState = ({
  title,
  description,
  message,
  action,
  onRetry,
}: ErrorStateProps): ReactNode => {
  const heading = title ?? message ?? 'Something went wrong';
  const copy = description ?? (title !== undefined ? message : undefined);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-6 py-12 text-center"
    >
      <h2 className="text-base font-medium text-ink">{heading}</h2>
      {copy !== undefined && (
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">{copy}</p>
      )}
      {action !== undefined && <div className="mt-1">{action}</div>}
      {action === undefined && onRetry !== undefined && (
        <button type="button" className={buttonClasses('secondary', 'sm')} onClick={onRetry}>
          <RefreshCw size={15} aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
};

/** Loading placeholder block that mirrors the shape of the real content. */
export const Skeleton = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}): ReactNode => (
  <div className={cn('animate-pulse rounded-md bg-overlay', className)} style={style} aria-hidden />
);

/** Centered spinner for short waits such as session bootstrap. */
export const LoadingState = ({ label = 'Loading…' }: { label?: string }): ReactNode => (
  <div
    role="status"
    aria-live="polite"
    className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted"
  >
    <RefreshCw size={16} className="animate-spin" aria-hidden />
    <span>{label}</span>
  </div>
);
