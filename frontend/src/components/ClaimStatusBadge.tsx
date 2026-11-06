import { claimStatusLabel } from '../lib/format';
import type { ClaimStatus } from '../types';
import './StatusBadge.css';

const TONES: Record<ClaimStatus, string> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const tone = TONES[status] ?? 'neutral';
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {claimStatusLabel(status)}
    </span>
  );
}
