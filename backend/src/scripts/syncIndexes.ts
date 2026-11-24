import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Claim } from '../modules/claims/claim.model.js';
import { Item } from '../modules/items/item.model.js';
import { LostReport } from '../modules/lostReports/lostReport.model.js';
import { User } from '../modules/users/user.model.js';

const models = { User, Item, LostReport, Claim };

async function main(): Promise<void> {
  await connectDatabase();
  try {
    for (const [name, model] of Object.entries(models)) {
      const dropped = await model.syncIndexes();
      const detail = dropped.length > 0 ? ` — dropped: ${dropped.join(', ')}` : '';
      console.log(`[indexes] ${name} synced${detail}`);
    }
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error) => {
  console.error('[indexes] failed:', error instanceof Error ? error.message : error);
  void mongoose.disconnect();
  process.exitCode = 1;
});
