import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Item } from '../modules/items/item.model.js';

/**
 * MongoDB Atlas Vector Search Index Configuration.
 *
 * IMPORTANT ARCHITECTURAL NOTE:
 * MongoDB Atlas Vector Search ($vectorSearch) does NOT support indexing vector
 * fields that are nested within an array of subdocuments (such as `images.embedding`).
 * Atlas Vector Search requires `path` to point directly to a field containing
 * a single array of numbers.
 *
 * For production deployment with Atlas Vector Search, choose between two architectures:
 *
 * OPTION A (Recommended for multi-image listings):
 * Create a dedicated collection, e.g. `item_embeddings`:
 * {
 *   _id: ObjectId,
 *   itemId: ObjectId,
 *   embedding: number[], // 512-dim unit vector
 *   status: "ACTIVE",
 *   createdBy: ObjectId
 * }
 * In Atlas, create the index on collection `item_embeddings` with path: "embedding".
 *
 * OPTION B (Single primary vector per item):
 * Add a root-level `primaryEmbedding: number[]` to the `Item` document.
 * In Atlas, create the index on collection `items` with path: "primaryEmbedding".
 */
export const ATLAS_VECTOR_INDEX_NAME = 'vector_index';

export const ATLAS_VECTOR_INDEX_SPEC = {
  name: ATLAS_VECTOR_INDEX_NAME,
  type: 'vectorSearch',
  definition: {
    fields: [
      {
        type: 'vector',
        path: 'primaryEmbedding', // Root-level vector path required by Atlas Search
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
        '[Atlas Vector Search] Note: Standalone/local MongoDB does not support Atlas Vector Search.\n' +
          'The in-memory bounded dot-product matching is currently active and fully functional.\n' +
          'Note that Atlas Vector Search requires the vector to be at the root of the document\n' +
          '(or in a dedicated item_embeddings collection) rather than inside an array of subdocuments.\n' +
          'Specification template:\n',
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
