import { apiRequest } from '@/shared/api/client';
import type { ClaimOnItem, Paginated } from '@/shared/api/types';

export async function submitClaim(itemId: string, message: string): Promise<ClaimOnItem> {
  const data = await apiRequest<{ claim: ClaimOnItem }>('/claims', {
    method: 'POST',
    body: { itemId, message },
  });
  return data.claim;
}

export async function listClaimsOnItem(
  itemId: string,
  page = 1,
  limit = 12,
): Promise<Paginated<ClaimOnItem>> {
  return apiRequest<Paginated<ClaimOnItem>>(`/items/${itemId}/claims`, {
    query: { page, limit },
  });
}

export async function decideClaim(
  claimId: string,
  decision: 'ACCEPTED' | 'REJECTED',
): Promise<ClaimOnItem> {
  const data = await apiRequest<{ claim: ClaimOnItem }>(`/claims/${claimId}/decision`, {
    method: 'PATCH',
    body: { decision },
  });
  return data.claim;
}
