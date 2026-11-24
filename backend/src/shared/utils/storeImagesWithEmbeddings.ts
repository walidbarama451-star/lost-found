import sharp from 'sharp';
import { embedImage } from '../../config/imageEmbedding.js';
import { deleteImage, storeImage } from '../../config/imageStorage.js';
import { normalizeVector } from './similarity.js';

export interface StoredImageWithEmbedding {
  url: string;
  publicId: string;
  embedding?: number[];
}

const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 82;
const DEFAULT_CONCURRENCY = 3;

interface PreparedImage {
  buffer: Buffer;
  mimeType: string;
}

async function prepareImage(buffer: Buffer, mimeType: string): Promise<PreparedImage> {
  try {
    const resized = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    // Invalid images (and already-small ones) fall back to the original bytes.
    if (resized.length >= buffer.length) return { buffer, mimeType };
    return { buffer: resized, mimeType: 'image/jpeg' };
  } catch {
    return { buffer, mimeType };
  }
}

/**
 * Stores and embeds uploaded images with bounded concurrency.
 *
 * If any file fails, every image that was already stored is deleted before the
 * error is re-thrown, so failed requests do not leave orphaned assets.
 */
export async function storeImagesWithEmbeddings(
  files: Express.Multer.File[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<StoredImageWithEmbedding[]> {
  const results = new Array<StoredImageWithEmbedding | undefined>(files.length);
  const workerCount = Math.min(Math.max(1, concurrency), files.length);
  let nextIndex = 0;
  let failure: unknown;

  const worker = async (): Promise<void> => {
    while (failure === undefined) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= files.length) return;

      const file = files[index];
      if (!file) return;

      try {
        const prepared = await prepareImage(file.buffer, file.mimetype);
        const [imageResult, embeddingResult] = await Promise.allSettled([
          storeImage(prepared.buffer, prepared.mimeType),
          embedImage(prepared.buffer, prepared.mimeType),
        ]);

        if (imageResult.status === 'rejected') throw imageResult.reason;

        const image = imageResult.value;
        const embedding =
          embeddingResult.status === 'fulfilled' ? embeddingResult.value : null;

        results[index] = embedding
          ? { ...image, embedding: normalizeVector(embedding) }
          : image;
      } catch (error) {
        failure ??= error;
        return;
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (failure !== undefined) {
    const stored = results.filter(
      (image): image is StoredImageWithEmbedding => image !== undefined,
    );
    await Promise.all(stored.map((image) => deleteImage(image.publicId)));
    throw failure;
  }

  return results as StoredImageWithEmbedding[];
}
