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

/** Clear, readable listing status label (spec 11). */
export default function StatusBadge({ status }: { status: ItemStatus }) {
  const tone = TONES[status] ?? 'neutral';
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {itemStatusLabel(status)}
    </span>
  );
}
