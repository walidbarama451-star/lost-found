/** Pure matching core: pairs a lost report's photos against found items. */

import { env } from '../../config/env.js';
import { cosineSimilarity, textSimilarity } from '../../shared/utils/similarity.js';
import type { MatchMethod } from './lostReport.model.js';

export interface MatchCandidate {
  itemId: string;
  title: string;
  description: string;
  category: string;
  /** Vectors for the item's photos (may be empty when the service was down). */
  imageEmbeddings: number[][];
}

export interface MatchResult {
  itemId: string;
  score: number;
  method: MatchMethod;
}

export interface ScoredCandidate extends MatchResult {
  candidate: MatchCandidate;
}

/** Best cosine similarity between the report's photos and an item's photos. */
function bestPhotoScore(
  reportEmbeddings: number[][],
  itemEmbeddings: number[][],
): number {
  let best = 0;
  for (const reportVector of reportEmbeddings) {
    for (const itemVector of itemEmbeddings) {
      const score = cosineSimilarity(reportVector, itemVector);
      if (score > best) best = score;
    }
  }
  return best;
}

/**
 * Text fallback for pairs without photo vectors (service unavailable):
 * fuzzy wording similarity plus a small category bonus, capped below the
 * photo ceiling so a text match never outranks a real photo match.
 */
function textScore(reportText: string, reportCategory: string, candidate: MatchCandidate): number {
  const similarity = textSimilarity(reportText, `${candidate.title} ${candidate.description}`);
  const categoryBonus = candidate.category === reportCategory ? 0.15 : 0;
  return Math.min(0.95, similarity * 0.85 + categoryBonus);
}

/**
 * Scores every candidate and keeps those above their method's threshold,
 * strongest first. Photo matches use embeddings and the strict photo
 * threshold; when the report or the item has no vectors (embedding service
 * unavailable) the text fallback applies with its own, more forgiving
 * threshold — descriptions rarely use identical wording.
 */
export function computeMatches(
  reportText: string,
  reportCategory: string,
  reportEmbeddings: number[][],
  candidates: MatchCandidate[],
): MatchResult[] {
  const photoThreshold = env.similarityThreshold;
  const textThreshold = env.textMatchThreshold;
  const matches: MatchResult[] = [];

  for (const candidate of candidates) {
    let score = 0;
    let method: MatchMethod = 'text';
    let qualifies = false;

    if (reportEmbeddings.length > 0 && candidate.imageEmbeddings.length > 0) {
      score = bestPhotoScore(reportEmbeddings, candidate.imageEmbeddings);
      method = 'photo';
      qualifies = score >= photoThreshold;
    }
    if (!qualifies) {
      const fallback = textScore(reportText, reportCategory, candidate);
      if (fallback >= textThreshold) {
        score = fallback;
        method = 'text';
        qualifies = true;
      }
    }

    if (qualifies) {
      matches.push({ itemId: candidate.itemId, score: Number(score.toFixed(4)), method });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 50);
}
