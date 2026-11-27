import type { ReactNode } from 'react';
import type { ClaimStatus } from '@/shared/api/types';
import { claimStatusLabel } from '@/shared/lib/format';
import { StatusBadge, type BadgeTone } from '@/shared/ui/StatusBadge';

const tones: Record<ClaimStatus, BadgeTone> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

export const ClaimStatusBadge = ({ status }: { status: ClaimStatus }): ReactNode => (
  <StatusBadge tone={tones[status] ?? 'neutral'}>{claimStatusLabel(status)}</StatusBadge>
);
