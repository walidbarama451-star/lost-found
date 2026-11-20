import { itemStatusLabel } from '../lib/format';
import type { ItemStatus } from '../types';
import './StatusBadge.css';

const TONES: Record<ItemStatus, string> = {
  ACTIVE: 'success',
  CLAIMED: 'info',
  RETURNED: 'neutral',
  CLOSED: 'neutral',
  HIDDEN: 'neutral',
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  const tone = TONES[status] ?? 'neutral';
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {itemStatusLabel(status)}
    </span>
  );
}
