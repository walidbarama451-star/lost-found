import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createItem, pngBuffer, registerUser } from './helpers.js';

describe('item creation', () => {
  it('publishes a listing with an image as the signed-in user', async () => {
    const user = await registerUser({ email: 'creator@example.com' });
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Black wallet')
      .attach('images', pngBuffer(), 'wallet.png');

    expect(res.status).toBe(201);
    expect(res.body.data.item).toMatchObject({
      title: 'Black wallet',
      status: 'ACTIVE',
      owner: { id: user.id, username: user.username },
    });
    expect(res.body.data.item.images).toHaveLength(1);
    expect(res.body.data.item.images[0].url).toBeTruthy();
    expect(res.body.data.item).not.toHaveProperty('location');
  });

  it('rejects a listing without an image', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'No photo item');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('image');
  });

  it('requires authentication to create a listing', async () => {
    const res = await request(app).post('/api/items').send({ title: 'Anonymous' });
    expect(res.status).toBe(401);
  });
});

describe('visibility and access control', () => {
  it('hides all listings from the public browse endpoint', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    await createItem(owner);

    const listed = await request(app).get('/api/items');
    expect(listed.status).toBe(404);
    expect(listed.body.data).toBeUndefined();
  });

  it('serves the detail page to the owner with owner-scoped fields only', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const { id } = await createItem(owner);

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data.item.id).toBe(id);
    const raw = JSON.stringify(detail.body);
    expect(raw).not.toContain('owner@example.com');
    expect(raw).not.toContain('passwordHash');
  });

  it('hides listings from other signed-in users who never matched them', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', stranger.cookie);
    expect(detail.status).toBe(404);
    expect(detail.body.message).toBe('Listing not found');
  });

  it('permanently removes a deleted listing from the owner list and detail', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    await request(app).delete(`/api/items/${id}`).set('Cookie', owner.cookie);

    const mine = await request(app).get('/api/items/mine').set('Cookie', owner.cookie);
    expect(mine.body.data.items).toHaveLength(0);

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(detail.status).toBe(404);
  });

  it('returns a 404 for a missing listing and 400 for a malformed id', async () => {
    const owner = await registerUser();
    const missing = await request(app)
      .get('/api/items/000000000000000000000000')
      .set('Cookie', owner.cookie);
    expect(missing.status).toBe(404);

    const malformed = await request(app).get('/api/items/not-an-id').set('Cookie', owner.cookie);
    expect(malformed.status).toBe(400);
  });
});

describe('editing and closing listings', () => {
  it('lets the owner update fields but never the owner reference', async () => {
    const owner = await registerUser();
    const intruder = await registerUser({ email: 'intruder@example.com' });
    const { id } = await createItem(owner);

    const res = await request(app)
      .patch(`/api/items/${id}`)
      .set('Cookie', owner.cookie)
      .send({ title: 'Updated wallet title', createdBy: intruder.id });

    expect(res.status).toBe(200);
    expect(res.body.data.item.title).toBe('Updated wallet title');
    expect(res.body.data.item.owner.id).toBe(owner.id);
    expect(res.body.data.item.status).toBe('ACTIVE');
  });

  it('rejects updates from a different user with 403', async () => {
    const owner = await registerUser();
    const other = await registerUser({ email: 'other@example.com' });
    const { id } = await createItem(owner);

    const res = await request(app)
      .patch(`/api/items/${id}`)
      .set('Cookie', other.cookie)
      .send({ title: 'Hijacked title attempt' });

    expect(res.status).toBe(403);

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(detail.body.data.item.title).toBe('Black wallet');
  });

  it('rejects deletes from a different user with 403', async () => {
    const owner = await registerUser();
    const other = await registerUser({ email: 'other@example.com' });
    const { id } = await createItem(owner);

    const res = await request(app).delete(`/api/items/${id}`).set('Cookie', other.cookie);
    expect(res.status).toBe(403);

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(detail.body.data.item.status).toBe('ACTIVE');
  });

  it('permanently deletes the owner listing', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    const res = await request(app).delete(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ deleted: true });

    const detail = await request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(detail.status).toBe(404);
  });

  it('requires authentication for mutations', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    const patch = await request(app).patch(`/api/items/${id}`).send({ title: 'Anonymous edit' });
    expect(patch.status).toBe(401);

    const remove = await request(app).delete(`/api/items/${id}`);
    expect(remove.status).toBe(401);
  });
});

describe('image uploads', () => {
  it('rejects unsupported file types with 415', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Bad file item')
      .attach('images', Buffer.from('%PDF-1.7 fake'), 'doc.pdf');

    expect(res.status).toBe(415);
  });

  it('rejects files whose content does not match an image format', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Spoofed image')
      .attach('images', Buffer.alloc(64, 65), { filename: 'fake.png', contentType: 'image/png' });

    expect(res.status).toBe(415);
  });

  it('rejects images larger than the 5 MB limit with 413', async () => {
    const user = await registerUser();
    const oversized = Buffer.concat([pngBuffer(), Buffer.alloc(6 * 1024 * 1024, 1)]);
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Huge photo item')
      .attach('images', oversized, 'huge.png');

    expect(res.status).toBe(413);
  });
});
