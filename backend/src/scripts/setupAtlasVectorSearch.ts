import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Item } from '../modules/items/item.model.js';

/**
 * MongoDB Atlas Vector Search Index Configuration.
 *
 * For production deployments on MongoDB Atlas:
 * 1. Log in to MongoDB Atlas -> Database -> Search.
 * 2. Click "Create Search Index" -> "Atlas Vector Search - JSON Editor".
 * 3. Choose database and collection "items".
 * 4. Paste the index definition below.
 */
export const ATLAS_VECTOR_INDEX_NAME = 'vector_index';

export const ATLAS_VECTOR_INDEX_SPEC = {
  name: ATLAS_VECTOR_INDEX_NAME,
  type: 'vectorSearch',
  definition: {
    fields: [
      {
        type: 'vector',
        path: 'images.embedding',
        numDimensions: 512,
        similarity: 'dotProduct',
      },
      {
        type: 'filter',
        path: 'status',
      },
      {
        type: 'filter',
        path: 'createdBy',
      },
    ],
  },
};

async function main(): Promise<void> {
  console.log('[Atlas Vector Search] Connecting to database...');
  await connectDatabase();

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection is not initialized');

    console.log('[Atlas Vector Search] Checking Search Index capabilities...');
    const collection = Item.collection;

    // Check if running on MongoDB Atlas with createSearchIndexes support
    if (typeof (collection as unknown as { createSearchIndexes?: unknown }).createSearchIndexes === 'function') {
      try {
        await (collection as unknown as {
          createSearchIndexes: (indexes: unknown[]) => Promise<unknown>;
        }).createSearchIndexes([ATLAS_VECTOR_INDEX_SPEC]);
        console.log(`[Atlas Vector Search] Created search index: "${ATLAS_VECTOR_INDEX_NAME}"`);
      } catch (error) {
        console.warn(
          '[Atlas Vector Search] Could not create index programmatically (requires MongoDB Atlas M0/M10+):',
          error instanceof Error ? error.message : error,
        );
      }
    } else {
      console.log(
        '[Atlas Vector Search] Standard standalone/local MongoDB does not support Atlas Vector Search.\n' +
          'The in-memory bounded dot-product matching is currently active and fully functional.\n' +
          'When deploying to MongoDB Atlas, create the following index on collection "items":\n',
        JSON.stringify(ATLAS_VECTOR_INDEX_SPEC, null, 2),
      );
    }
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error) => {
  console.error('[Atlas Vector Search] error:', error instanceof Error ? error.message : error);
  void mongoose.disconnect();
  process.exitCode = 1;
});
