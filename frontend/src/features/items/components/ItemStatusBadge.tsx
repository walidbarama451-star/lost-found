import type { ReactNode } from 'react';
import type { ItemStatus } from '@/shared/api/types';
import { itemStatusLabel } from '@/shared/lib/format';
import { StatusBadge, type BadgeTone } from '@/shared/ui/StatusBadge';

const tones: Record<ItemStatus, BadgeTone> = {
  ACTIVE: 'success',
  CLAIMED: 'info',
  RETURNED: 'neutral',
  CLOSED: 'neutral',
  HIDDEN: 'neutral',
};

export const ItemStatusBadge = ({ status }: { status: ItemStatus }): ReactNode => (
  <StatusBadge tone={tones[status] ?? 'neutral'}>{itemStatusLabel(status)}</StatusBadge>
);
