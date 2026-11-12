/**
 * One-off maintenance script: computes photo embeddings for items (and lost
 * reports) that were uploaded before the matching feature existed, so they can
 * participate in photo matching.
 *
 * Usage:  npm run backfill-embeddings
 * Requires HF_TOKEN to be configured (see .env.example).
 */

import mongoose from 'mongoose';
import { embedImage } from '../config/imageEmbedding.js';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Item } from '../modules/items/item.model.js';
import { LostReport } from '../modules/lostReports/lostReport.model.js';

async function backfillItems(): Promise<{ images: number; items: number }> {
  const items = await Item.find({ 'images.embedding': { $exists: false } }).select('+images.embedding');
  let images = 0;

  for (const item of items) {
    let changed = false;
    for (const image of item.images) {
      if (image.embedding?.length) continue;
      const response = await fetch(image.url.startsWith('/') ? `${origin()}${image.url}` : image.url);
      if (!response.ok) {
        console.warn(`[backfill] could not download ${image.url} (${response.status})`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const embedding = await embedImage(buffer, 'image/jpeg');
      if (embedding) {
        image.embedding = embedding;
        changed = true;
        images += 1;
      }
    }
    if (changed) await item.save();
  }

  return { images, items: items.length };
}

function origin(): string {
  return `http://127.0.0.1:${env.port}`;
}

async function backfillReports(): Promise<{ images: number; reports: number }> {
  const reports = await LostReport.find({ 'images.embedding': { $exists: false } }).select('+images.embedding');
  let images = 0;

  for (const report of reports) {
    let changed = false;
    for (const image of report.images) {
      if (image.embedding?.length) continue;
      const response = await fetch(image.url.startsWith('/') ? `${origin()}${image.url}` : image.url);
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      const embedding = await embedImage(buffer, 'image/jpeg');
      if (embedding) {
        image.embedding = embedding;
        changed = true;
        images += 1;
      }
    }
    if (changed) await report.save();
  }

  return { images, reports: reports.length };
}

async function main(): Promise<void> {
  if (!env.embeddingConfigured) {
    console.error('HF_TOKEN is not configured — nothing to do.');
    process.exitCode = 1;
    return;
  }

  await connectDatabase();
  try {
    const items = await backfillItems();
    const reports = await backfillReports();
    console.log(
      `[backfill] items scanned: ${items.items}, images embedded: ${items.images}; ` +
        `reports scanned: ${reports.reports}, images embedded: ${reports.images}`,
    );
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error) => {
  console.error('[backfill] failed:', error instanceof Error ? error.message : error);
  void mongoose.disconnect();
  process.exitCode = 1;
});
