import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Item } from '../modules/items/item.model.js';
import { LostReport } from '../modules/lostReports/lostReport.model.js';
import { isNormalized, normalizeVector } from '../shared/utils/similarity.js';

interface NormalizeResult {
  documents: number;
  vectors: number;
}

async function normalizeItems(): Promise<NormalizeResult> {
  const cursor = Item.find({ 'images.embedding': { $exists: true } })
    .select('+images.embedding')
    .cursor();

  let documents = 0;
  let vectors = 0;

  for await (const item of cursor) {
    let changed = false;
    for (const image of item.images) {
      if (!image.embedding?.length || isNormalized(image.embedding)) continue;
      image.embedding = normalizeVector(image.embedding);
      changed = true;
      vectors += 1;
    }
    if (changed) {
      await item.save();
      documents += 1;
    }
  }

  return { documents, vectors };
}

async function normalizeReports(): Promise<NormalizeResult> {
  const cursor = LostReport.find({ 'images.embedding': { $exists: true } })
    .select('+images.embedding')
    .cursor();

  let documents = 0;
  let vectors = 0;

  for await (const report of cursor) {
    let changed = false;
    for (const image of report.images) {
      if (!image.embedding?.length || isNormalized(image.embedding)) continue;
      image.embedding = normalizeVector(image.embedding);
      changed = true;
      vectors += 1;
    }
    if (changed) {
      await report.save();
      documents += 1;
    }
  }

  return { documents, vectors };
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    const items = await normalizeItems();
    const reports = await normalizeReports();
    console.log(
      `[normalize] items updated: ${items.documents}, vectors: ${items.vectors}; ` +
        `reports updated: ${reports.documents}, vectors: ${reports.vectors}`,
    );
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error) => {
  console.error('[normalize] failed:', error instanceof Error ? error.message : error);
  void mongoose.disconnect();
  process.exitCode = 1;
});
