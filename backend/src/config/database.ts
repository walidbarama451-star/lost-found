import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(uri: string = env.mongodbUri): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

/** Deletes every document in the connected database (test helper). */
export async function clearDatabase(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}
