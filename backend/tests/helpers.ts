import type { Express } from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import { clearDatabase, connectDatabase, disconnectDatabase } from '../src/config/database.js';

export const app: Express = createApp();

beforeAll(async () => {
  await connectDatabase(process.env.MONGODB_TEST_URI);
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

export function pngBuffer(fill = 64): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(fill, 7),
  ]);
}

export function jpegBuffer(fill = 64): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(fill, 7)]);
}

export interface TestUser {
  id: string;
  username: string;
  discordUsername: string;
  email: string;
  cookie: string;
}

export async function registerUser(
  overrides: Partial<{ username: string; discordUsername: string; email: string; password: string }> = {},
): Promise<TestUser> {
  const payload = {
    username: 'user',
    discordUsername: 'user_discord',
    email: 'user@example.com',
    password: 'StrongPassword123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    id: res.body.data.user.id as string,
    username: res.body.data.user.username as string,
    discordUsername: res.body.data.user.discordUsername as string,
    email: res.body.data.user.email as string,
    cookie: cookieOf(res),
  };
}

export function cookieOf(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const tokenCookie = cookies.find((entry) => entry.startsWith('lost_and_found_token='));
  if (!tokenCookie) throw new Error('Expected an auth cookie in the response');
  return tokenCookie.split(';')[0] as string;
}

export interface CreateItemOverrides {
  title?: string;
}

export async function createItem(
  user: TestUser,
  overrides: CreateItemOverrides = {},
): Promise<{ id: string; body: AnyRecord }> {
  const res = await request(app)
    .post('/api/items')
    .set('Cookie', user.cookie)
    .field('title', overrides.title ?? 'Black wallet')
    .attach('images', pngBuffer(), 'photo.png');

  if (res.status !== 201) {
    throw new Error(`createItem failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { id: res.body.data.item.id as string, body: res.body };
}

export async function submitClaim(user: TestUser, itemId: string, message?: string) {
  return request(app)
    .post('/api/claims')
    .set('Cookie', user.cookie)
    .send({ itemId, message: message ?? 'The wallet has a scratch on the inside cover with my initials.' });
}

type AnyRecord = Record<string, unknown>;
