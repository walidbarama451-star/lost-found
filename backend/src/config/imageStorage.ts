import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export interface StoredImage {
  /** Delivery URL stored on the item document. */
  url: string;
  /** Provider asset identifier, used for later deletion. */
  publicId: string;
}

/**
 * Stores an image with the configured provider:
 * - `cloudinary` when CLOUDINARY_* credentials are present,
 * - `local` disk fallback (served from /uploads) otherwise.
 */
export async function storeImage(buffer: Buffer, mimeType: string): Promise<StoredImage> {
  if (env.imageStorage === 'cloudinary') {
    return uploadToCloudinary(buffer);
  }
  return saveToDisk(buffer, mimeType);
}

async function uploadToCloudinary(buffer: Buffer): Promise<StoredImage> {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary storage selected but CLOUDINARY_* credentials are not configured');
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  return new Promise<StoredImage>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'lost-and-found', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

async function saveToDisk(buffer: Buffer, mimeType: string): Promise<StoredImage> {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const publicId = `${randomUUID()}.${extension}`;
  const directory = uploadDirectory();
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, publicId), buffer);
  return { url: `/uploads/${publicId}`, publicId };
}

function uploadDirectory(): string {
  return path.resolve(process.cwd(), env.uploadDir);
}

/** Removes a previously stored image. Never trusts client-provided paths. */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    if (env.imageStorage === 'cloudinary') {
      await cloudinary.uploader.destroy(publicId);
      return;
    }
    const filename = path.basename(publicId);
    await fs.unlink(path.join(uploadDirectory(), filename));
  } catch (error) {
    // Best effort: log and continue, the DB record is already updated.
    console.error(
      `[images] failed to delete asset ${publicId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}
