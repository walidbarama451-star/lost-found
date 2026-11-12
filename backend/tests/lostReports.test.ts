import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app, createItem, pngBuffer, registerUser } from './helpers.js';

/**
 * The embedding service is mocked: photo vectors are keyed by the uploaded
 * buffer length, so a test can stage "this photo looks like that photo"
 * scenarios without any network access. A missing entry means the photo was
 * uploaded while the embedding service was unavailable (null vector).
 */
const state = vi.hoisted(() => ({ vectors: new Map<number, number[]>() }));

vi.mock('../src/config/imageEmbedding.js', () => ({
  embedImage: vi.fn(async (buffer: Buffer) => state.vectors.get(buffer.length) ?? null),
}));

afterEach(() => {
  state.vectors.clear();
});

function createLostReport(user: { cookie: string }, overrides: Record<string, string> = {}) {
  const fields = {
    title: 'Lost my black wallet',
    description: 'Black leather wallet with a card holder, lost near the library.',
    category: 'ACCESSORIES',
    dateLost: '2026-10-30',
    ...overrides,
  };
  return request(app)
    .post('/api/lost-reports')
    .set('Cookie', user.cookie)
    .field('title', fields.title)
    .field('description', fields.description)
    .field('category', fields.category)
    .field('dateLost', fields.dateLost)
    .attach('images', pngBuffer(96), 'mine.png');
}

describe('lost report creation and photo matching', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/lost-reports')
      .field('title', 'Lost wallet')
      .field('description', 'Black leather wallet lost near the library entrance.')
      .field('category', 'ACCESSORIES')
      .field('dateLost', '2026-10-30')
      .attach('images', pngBuffer(), 'mine.png');
    expect(res.status).toBe(401);
  });

  it('rejects a report without a photo', async () => {
    const user = await registerUser({ email: 'searcher@example.com' });
    const res = await request(app)
      .post('/api/lost-reports')
      .set('Cookie', user.cookie)
      .field('title', 'No photo report')
      .field('description', 'This report tries to be created without any attached photos.')
      .field('category', 'KEYS')
      .field('dateLost', '2026-10-30');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('photo');
  });

  it('matches a found item whose photo looks like the lost one and unlocks its detail page', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    // Both photos carry the same vector → they "look alike".
    const vector = [0.9, 0.4, 0.1, 0.05];
    state.vectors.set(pngBuffer().length, vector);
    const { id: itemId } = await createItem(finder);
    state.vectors.set(pngBuffer(96).length, vector);

    const res = await createLostReport(searcher);
    expect(res.status).toBe(201);
    const report = res.body.data.report;
    expect(report.matches).toHaveLength(1);
    expect(report.matches[0]).toMatchObject({ itemId, method: 'photo', available: true });
    expect(report.matches[0].score).toBeGreaterThan(0.99);
    // Embeddings must never leak into the response.
    expect(JSON.stringify(res.body)).not.toContain('embedding');

    // The match unlocks the detail page for the searcher.
    const detail = await request(app).get(`/api/items/${itemId}`).set('Cookie', searcher.cookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data.item.id).toBe(itemId);
    expect(JSON.stringify(detail.body)).not.toContain('publicId');
  });

  it('does not match unrelated photos or descriptions', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    state.vectors.set(pngBuffer().length, [1, 0, 0, 0]);
    const { id: itemId } = await createItem(finder, {
      title: 'Silver keys ring',
      description: 'A small ring of silver keys found at the sports hall reception.',
      category: 'KEYS',
    });
    state.vectors.set(pngBuffer(96).length, [0, 0, 1, 1]);

    const res = await createLostReport(searcher);
    expect(res.status).toBe(201);
    expect(res.body.data.report.matches).toHaveLength(0);

    const detail = await request(app).get(`/api/items/${itemId}`).set('Cookie', searcher.cookie);
    expect(detail.status).toBe(404);
  });

  it('never matches the searcher against their own found items', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });

    const vector = [0.5, 0.5, 0.5, 0.5];
    state.vectors.set(pngBuffer().length, vector);
    const { id: itemId } = await createItem(finder);
    state.vectors.set(pngBuffer(96).length, vector);

    const res = await createLostReport(finder);
    expect(res.status).toBe(201);
    expect(res.body.data.report.matches).toHaveLength(0);

    // The owner still sees their own listing.
    const detail = await request(app).get(`/api/items/${itemId}`).set('Cookie', finder.cookie);
    expect(detail.status).toBe(200);
  });

  it('falls back to text matching when photos carry no vectors', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    const { id: itemId } = await createItem(finder);
    expect(state.vectors.size).toBe(0); // embedding service unavailable

    // Near-identical wording clears the text threshold.
    const res = await createLostReport(searcher, {
      title: 'Black wallet',
      description: 'Black leather wallet found near the library entrance',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.report.matches).toHaveLength(1);
    expect(res.body.data.report.matches[0]).toMatchObject({ itemId, method: 'text', available: true });
  });

  it('matches partially overlapping descriptions without identical wording', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    const { id: itemId } = await createItem(finder, {
      title: 'Wallet turned in',
      description: 'Black wallet with a card holder, found in the library cafe.',
    });

    const res = await createLostReport(searcher);
    expect(res.status).toBe(201);
    expect(res.body.data.report.matches).toHaveLength(1);
    expect(res.body.data.report.matches[0]).toMatchObject({ itemId, method: 'text' });
  });

  it('does not match unrelated descriptions', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    await createItem(finder, {
      title: 'Set of keys',
      description: 'Silver key ring with three keys on a blue strap.',
    });

    const res = await createLostReport(searcher);
    expect(res.status).toBe(201);
    expect(res.body.data.report.matches).toHaveLength(0);
  });
});

describe('lost report search lifecycle', () => {
  it('re-running the search surfaces newly published found items', async () => {
    const finder = await registerUser({ email: 'finder@example.com' });
    const searcher = await registerUser({ email: 'searcher@example.com' });

    const vector = [0.8, 0.6, 0.3, 0.2];
    state.vectors.set(pngBuffer(96).length, vector);

    const created = await createLostReport(searcher);
    const reportId = created.body.data.report.id as string;
    expect(created.body.data.report.matches).toHaveLength(0);

    state.vectors.set(pngBuffer().length, vector);
    const { id: itemId } = await createItem(finder);

    const rerun = await request(app).post(`/api/lost-reports/${reportId}/search`).set('Cookie', searcher.cookie);
    expect(rerun.status).toBe(200);
    expect(rerun.body.data.report.matches).toHaveLength(1);
    expect(rerun.body.data.report.matches[0].itemId).toBe(itemId);
    expect(rerun.body.data.report.lastSearchedAt).toBeTruthy();
  });

  it('keeps reports private between users', async () => {
    const searcher = await registerUser({ email: 'searcher@example.com' });
    const other = await registerUser({ email: 'other@example.com' });

    const created = await createLostReport(searcher);
    const reportId = created.body.data.report.id as string;

    const asOther = await request(app).get(`/api/lost-reports/${reportId}`).set('Cookie', other.cookie);
    expect(asOther.status).toBe(404);

    const mine = await request(app).get('/api/lost-reports').set('Cookie', searcher.cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data.reports).toHaveLength(1);
    expect(mine.body.data.pagination).toMatchObject({ page: 1, total: 1, totalPages: 1 });
  });

  it('supports updating and closing a report', async () => {
    const searcher = await registerUser({ email: 'searcher@example.com' });
    const created = await createLostReport(searcher);
    const reportId = created.body.data.report.id as string;

    const patched = await request(app)
      .patch(`/api/lost-reports/${reportId}`)
      .set('Cookie', searcher.cookie)
      .send({ title: 'Lost my brown wallet', status: 'CLOSED' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.report).toMatchObject({ title: 'Lost my brown wallet', status: 'CLOSED' });
  });

  it('rejects updates from other users', async () => {
    const searcher = await registerUser({ email: 'searcher@example.com' });
    const other = await registerUser({ email: 'other@example.com' });
    const created = await createLostReport(searcher);
    const reportId = created.body.data.report.id as string;

    const res = await request(app)
      .patch(`/api/lost-reports/${reportId}`)
      .set('Cookie', other.cookie)
      .send({ title: 'Hijacked title' });
    expect(res.status).toBe(404);
  });

  it('deletes a report', async () => {
    const searcher = await registerUser({ email: 'searcher@example.com' });
    const created = await createLostReport(searcher);
    const reportId = created.body.data.report.id as string;

    const removed = await request(app).delete(`/api/lost-reports/${reportId}`).set('Cookie', searcher.cookie);
    expect(removed.status).toBe(200);

    const after = await request(app).get(`/api/lost-reports/${reportId}`).set('Cookie', searcher.cookie);
    expect(after.status).toBe(404);
  });
});
