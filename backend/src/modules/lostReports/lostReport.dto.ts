import type { Types } from 'mongoose';
import type { ItemDoc } from '../items/item.model.js';
import type { LostReportDoc, MatchMethod } from './lostReport.model.js';

export interface LostReportMatchDto {
  itemId: string;
  score: number;
  method: MatchMethod;
  title: string;
  category: string;
  dateFound: string;
  status: string;
  image: string | null;
  /** False when the listing was closed/claimed after being matched. */
  available: boolean;
}

export interface LostReportDto {
  id: string;
  title: string;
  description: string;
  category: string;
  dateLost: string;
  status: string;
  images: { url: string }[];
  matches: LostReportMatchDto[];
  lastSearchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Builds the report DTO. `itemDocs` enriches matches with live item data. */
export function toLostReportDto(
  report: LostReportDoc,
  itemDocs: ItemDoc[] = [],
): LostReportDto {
  const byId = new Map<string, ItemDoc>(itemDocs.map((doc) => [doc._id.toString(), doc]));

  return {
    id: report._id.toString(),
    title: report.title,
    description: report.description,
    category: report.category,
    dateLost: report.dateLost.toISOString(),
    status: report.status,
    images: report.images.map((image) => ({ url: image.url })),
    matches: report.matches
      .map((match) => {
        const doc = byId.get(match.item.toString());
        const images = doc?.images ?? [];
        return {
          itemId: match.item.toString(),
          score: match.score,
          method: match.method,
          title: doc?.title ?? 'Listing unavailable',
          category: doc?.category ?? 'OTHER',
          dateFound: (doc?.dateFound ?? new Date(0)).toISOString(),
          status: doc?.status ?? 'CLOSED',
          image: images[0]?.url ?? null,
          available: doc?.status === 'ACTIVE',
        };
      })
      .filter((match) => byId.has(match.itemId)),
    lastSearchedAt: report.lastSearchedAt ? report.lastSearchedAt.toISOString() : null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export type OwnerRef = Types.ObjectId;
