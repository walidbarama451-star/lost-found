import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-[#e1f4eb] text-success ring-success/30',
  danger: 'bg-[#fbe7ed] text-danger ring-danger/30',
  warning: 'bg-[#fef3dd] text-warning ring-warning/30',
  info: 'bg-accent-100 text-accent-700 ring-accent-300',
  neutral: 'bg-overlay text-ink-muted ring-transparent',
};

interface StatusBadgeProps {
  tone: BadgeTone;
  children: ReactNode;
}

/** Compact pill for item/claim state, using the leaderboard medallion tones. */
export const StatusBadge = ({ tone, children }: StatusBadgeProps): ReactNode => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
      toneClasses[tone],
    )}
  >
    {children}
  </span>
);
