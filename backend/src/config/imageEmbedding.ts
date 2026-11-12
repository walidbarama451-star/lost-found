/**
 * Photo embeddings for lost-item matching.
 *
 * Sends an image to the Hugging Face Inference API and receives a numeric
 * vector describing the visual content (CLIP-style). Two photos of similar
 * objects produce vectors with a high cosine similarity — that is the
 * "looks like it" signal used by the lost-report matching service.
 *
 * When no HF_TOKEN is configured the module degrades gracefully: `embedImage`
 * resolves to `null` and the matcher falls back to text-only scoring.
 */

import { env } from './env.js';

const HF_INFERENCE_BASE = 'https://router.huggingface.co/hf-inference/models';
const REQUEST_TIMEOUT_MS = 20_000;

export type ImageEmbedding = number[];

function endpoint(): string {
  return `${HF_INFERENCE_BASE}/${env.hfEmbeddingModel}`;
}

/** Flattens one level: some pipelines answer with `[[…]]` instead of `[…]`. */
function toVector(payload: unknown): ImageEmbedding | null {
  const unwrap = (value: unknown): unknown => {
    if (Array.isArray(value) && value.length === 1 && Array.isArray(value[0])) {
      return unwrap(value[0]);
    }
    return value;
  };

  const candidate = unwrap(payload);
  if (!Array.isArray(candidate) || candidate.length === 0) return null;
  if (!candidate.every((entry) => typeof entry === 'number' && Number.isFinite(entry))) {
    return null;
  }
  return candidate as ImageEmbedding;
}

/**
 * Computes an embedding for one image, or `null` when the service is not
 * configured / temporarily unavailable. Failures never block uploads —
 * the image is stored without a vector and text matching still applies.
 */
export async function embedImage(buffer: Buffer, mimeType: string): Promise<ImageEmbedding | null> {
  if (!env.embeddingConfigured) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.hfToken}`,
        'Content-Type': mimeType,
        'x-wait-for-model': 'true',
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[embeddings] ${env.hfEmbeddingModel} responded ${response.status}; image stored without a vector`,
      );
      return null;
    }

    const vector = toVector(await response.json());
    if (!vector) {
      console.error('[embeddings] unexpected response shape; image stored without a vector');
      return null;
    }
    return vector;
  } catch (error) {
    console.error(
      '[embeddings] request failed:',
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
