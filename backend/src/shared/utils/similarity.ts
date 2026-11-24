const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'was', 'were', 'from', 'near',
  'into', 'have', 'has', 'had', 'not', 'but', 'are', 'you', 'his', 'her',
  'its', 'their', 'they', 'when', 'what', 'where', 'which', 'while', 'about',
]);

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

export function normalizeVector(vector: readonly number[]): number[] {
  let squaredNorm = 0;
  for (const value of vector) squaredNorm += value * value;
  if (squaredNorm === 0) return vector.map(() => 0);

  const scale = 1 / Math.sqrt(squaredNorm);
  return vector.map((value) => value * scale);
}

export function isNormalized(vector: readonly number[], tolerance = 1e-6): boolean {
  let squaredNorm = 0;
  for (const value of vector) squaredNorm += value * value;
  return Math.abs(squaredNorm - 1) <= tolerance;
}

export function normalizeIfNeeded(vector: readonly number[]): readonly number[] {
  return isNormalized(vector) ? vector : normalizeVector(vector);
}

export function dotProduct(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += (a[index] ?? 0) * (b[index] ?? 0);
  }
  return dot;
}

function stem(token: string): string {
  return token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    .map(stem);
}

interface TokenStats {
  reportTokens: Set<string>;
  itemTokens: Set<string>;
  shared: number;
}

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

export function textOverlap(reportText: string, itemText: string): number {
  const stats = tokenStats(reportText, itemText);
  if (!stats) return 0;
  const union = stats.reportTokens.size + stats.itemTokens.size - stats.shared;
  return union === 0 ? 0 : stats.shared / union;
}

export function textSimilarity(reportText: string, itemText: string): number {
  const stats = tokenStats(reportText, itemText);
  if (!stats) return 0;
  const union = stats.reportTokens.size + stats.itemTokens.size - stats.shared;
  const jaccard = union === 0 ? 0 : stats.shared / union;
  const coverage = stats.shared / stats.reportTokens.size;
  return 0.5 * jaccard + 0.5 * coverage;
}
