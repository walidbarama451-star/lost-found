import type { Types } from 'mongoose';
import type { ItemDoc } from '../items/item.model.js';
import type { LostReportDoc, MatchMethod } from './lostReport.model.js';

export interface LostReportMatchDto {
  itemId: string;
  score: number;
  method: MatchMethod;
  title: string;
  status: string;
  image: string | null;
  available: boolean;
}

export interface LostReportDto {
  id: string;
  title: string;
  status: string;
  images: { url: string }[];
  matches: LostReportMatchDto[];
  lastSearchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toLostReportDto(
  report: LostReportDoc,
  itemDocs: ItemDoc[] = [],
): LostReportDto {
  const byId = new Map<string, ItemDoc>(itemDocs.map((doc) => [doc._id.toString(), doc]));

  return {
    id: report._id.toString(),
    title: report.title,
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
