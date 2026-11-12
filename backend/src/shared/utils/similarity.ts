/** Vector + text similarity used by the lost-report matcher. Pure functions. */

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'was', 'were', 'from', 'near',
  'into', 'have', 'has', 'had', 'not', 'but', 'are', 'you', 'his', 'her',
  'its', 'their', 'they', 'when', 'what', 'where', 'which', 'while', 'about',
]);

/** Cosine similarity between two equal-length vectors; 0 on degenerate input. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Trivial plural stemmer: drops a trailing "s" from longer words ("keys" → "key"). */
function stem(token: string): string {
  return token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token;
}

/** Lowercase word tokens (letters/digits, 3+ chars, stopwords removed, plurals stemmed). */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    .map(stem);
}

interface TokenStats {
  reportTokens: Set<string>;
  itemTokens: Set<string>;
  /** Words of the report that also appear in the item's text. */
  shared: number;
}

/** Shared-token statistics for both texts, or null when either side is empty. */
function tokenStats(reportText: string, itemText: string): TokenStats | null {
  const reportTokens = new Set(tokenize(reportText));
  const itemTokens = new Set(tokenize(itemText));
  if (reportTokens.size === 0 || itemTokens.size === 0) return null;

  let shared = 0;
  for (const token of reportTokens) {
    if (itemTokens.has(token)) shared += 1;
  }
  return { reportTokens, itemTokens, shared };
}

/**
 * Jaccard overlap between the report text and an item's text, in 0–1.
 * Empty sides produce 0.
 */
export function textOverlap(reportText: string, itemText: string): number {
  const stats = tokenStats(reportText, itemText);
  if (!stats) return 0;
  const union = stats.reportTokens.size + stats.itemTokens.size - stats.shared;
  return union === 0 ? 0 : stats.shared / union;
}

/**
 * Fuzzier text similarity in 0–1: blends the Jaccard overlap with how much of
 * the report's wording the item's text covers. Coverage weighs equally because
 * finders write short notes while searchers describe the same item in more
 * detail — strict Jaccard alone demands near-identical wording.
 */
export function textSimilarity(reportText: string, itemText: string): number {
  const stats = tokenStats(reportText, itemText);
  if (!stats) return 0;
  const union = stats.reportTokens.size + stats.itemTokens.size - stats.shared;
  const jaccard = union === 0 ? 0 : stats.shared / union;
  const coverage = stats.shared / stats.reportTokens.size;
  return 0.5 * jaccard + 0.5 * coverage;
}
