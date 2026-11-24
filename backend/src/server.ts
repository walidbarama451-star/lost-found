// Scale libuv worker thread pool for concurrent sharp (libvips) and native bcrypt hashing
if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = '8';
}

import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function main(): Promise<void> {
  await connectDatabase();
  console.log(`[db] connected to ${env.mongodbUri.replace(/\/\/[^@]*@/, '//***@')}`);

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
    console.log(`[api] health check: http://localhost:${env.port}/api/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[api] received ${signal}, shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[api] failed to start:', error);
  process.exit(1);
});
