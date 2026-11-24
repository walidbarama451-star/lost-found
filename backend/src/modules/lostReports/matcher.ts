import { env } from '../../config/env.js';
import { dotProduct, textSimilarity } from '../../shared/utils/similarity.js';
import type { MatchMethod } from './lostReport.model.js';

export interface MatchCandidate {
  itemId: string;
  title: string;
  imageEmbeddings: readonly (readonly number[])[];
}

export interface MatchResult {
  itemId: string;
  score: number;
  method: MatchMethod;
}

export interface ScoredCandidate extends MatchResult {
  candidate: MatchCandidate;
}

function bestPhotoScore(
  reportEmbeddings: readonly (readonly number[])[],
  itemEmbeddings: readonly (readonly number[])[],
): number {
  let best = 0;
  for (const reportVector of reportEmbeddings) {
    for (const itemVector of itemEmbeddings) {
      const score = dotProduct(reportVector, itemVector);
      if (score > best) best = score;
    }
  }
  return best;
}

function textScore(reportText: string, candidate: MatchCandidate): number {
  const similarity = textSimilarity(reportText, candidate.title);
  return Math.min(0.95, similarity * 0.85);
}

export function computeMatches(
  reportText: string,
  reportEmbeddings: readonly (readonly number[])[],
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
      const fallback = textScore(reportText, candidate);
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
