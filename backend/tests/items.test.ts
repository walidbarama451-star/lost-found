import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createItem, jpegBuffer, pngBuffer, registerUser } from './helpers.js';

describe('item creation', () => {
  it('publishes a listing with an image as the signed-in user', async () => {
    const user = await registerUser({ email: 'creator@example.com' });
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Black wallet')
      .field('description', 'Black leather wallet found near the library entrance.')
      .field('category', 'ACCESSORIES')
      .field('locationLabel', 'Near the central library')
      .field('locationCity', 'Algiers')
      .field('locationCountry', 'Algeria')
      .field('dateFound', '2026-10-30')
      .attach('images', pngBuffer(), 'wallet.png');

    expect(res.status).toBe(201);
    expect(res.body.data.item).toMatchObject({
      title: 'Black wallet',
      category: 'ACCESSORIES',
      status: 'ACTIVE',
      owner: { id: user.id, username: user.username },
    });
    expect(res.body.data.item.images).toHaveLength(1);
    expect(res.body.data.item.images[0].url).toBeTruthy();
  });

  it('rejects a listing without an image', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'No photo item')
      .field('description', 'This listing tries to be created without any attached images.')
      .field('category', 'KEYS')
      .field('locationLabel', 'Bus stop')
      .field('dateFound', '2026-10-30');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('image');
  });

  it('rejects an unknown category', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Mystery item')
      .field('description', 'A listing with a category that is not part of the controlled list.')
      .field('category', 'WEAPONS')
      .field('locationLabel', 'Park')
      .field('dateFound', '2026-10-30')
      .attach('images', pngBuffer(), 'x.png');

    expect(res.status).toBe(400);
  });

  it('rejects a future date found', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Time traveler keys')
      .field('description', 'Keys that were supposedly found on a date far in the future.')
      .field('category', 'KEYS')
      .field('locationLabel', 'Station')
      .field('dateFound', '2099-01-01')
      .attach('images', jpegBuffer(), 'keys.jpg');

    expect(res.status).toBe(400);
  });

  it('requires authentication to create a listing', async () => {
    const res = await request(app).post('/api/items').send({ title: 'Anonymous' });
    expect(res.status).toBe(401);
  });
});

describe('browsing and search', () => {
  it('returns only ACTIVE listings with public fields only', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const { id } = await createItem(owner);

    const listed = await request(app).get('/api/items');
    expect(listed.status).toBe(200);
    expect(listed.body.data.items).toHaveLength(1);
    expect(listed.body.data.pagination).toMatchObject({ page: 1, limit: 12, total: 1, totalPages: 1 });

    const item = listed.body.data.items[0];
    expect(item.id).toBe(id);
    expect(item.owner).toEqual({ id: owner.id, username: owner.username });
    // Public payload must not leak owner contact details or image publicIds.
    const raw = JSON.stringify(listed.body);
    expect(raw).not.toContain('owner@example.com');
    expect(raw).not.toContain('publicId');
    expect(raw).not.toContain('passwordHash');
  });

  it('hides closed listings from public results but shows them to their owner', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    await request(app).delete(`/api/items/${id}`).set('Cookie', owner.cookie);

    const publicList = await request(app).get('/api/items');
    expect(publicList.body.data.items).toHaveLength(0);

    const mine = await request(app).get('/api/items/mine').set('Cookie', owner.cookie);
    expect(mine.body.data.items).toHaveLength(1);
    expect(mine.body.data.items[0].status).toBe('CLOSED');
  });

  it('searches by keyword and filters by category', async () => {
    const user = await registerUser();
    await createItem(user, { title: 'Blue backpack', category: 'BAGS' });
    await createItem(user, { title: 'Silver keys', category: 'KEYS' });

    const search = await request(app).get('/api/items?q=backpack');
    expect(search.body.data.items).toHaveLength(1);
    expect(search.body.data.items[0].title).toBe('Blue backpack');

    const filtered = await request(app).get('/api/items?category=KEYS');
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].category).toBe('KEYS');

    const miss = await request(app).get('/api/items?q=nothing-matches-this');
    expect(miss.status).toBe(200);
    expect(miss.body.data.items).toHaveLength(0);
    expect(miss.body.data.pagination.total).toBe(0);
  });

  it('treats regex characters in the search string as literals', async () => {
    const user = await registerUser();
    await createItem(user, { title: 'Ordinary phone' });

    const res = await request(app).get('/api/items?q=.*');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('clamps the page size to the documented maximum', async () => {
    const res = await request(app).get('/api/items?limit=999');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBe(50);
  });

  it('rejects non-numeric pagination', async () => {
    const res = await request(app).get('/api/items?page=abc');
    expect(res.status).toBe(400);
  });

  it('paginates results', async () => {
    const user = await registerUser();
    for (let index = 0; index < 3; index += 1) {
      await createItem(user, { title: `Item number ${index}` });
    }

    const firstPage = await request(app).get('/api/items?page=1&limit=2');
    expect(firstPage.body.data.items).toHaveLength(2);
    expect(firstPage.body.data.pagination).toMatchObject({ total: 3, totalPages: 2 });

    const secondPage = await request(app).get('/api/items?page=2&limit=2');
    expect(secondPage.body.data.items).toHaveLength(1);
  });

  it('returns a 404 for a missing listing and 400 for a malformed id', async () => {
    const missing = await request(app).get('/api/items/000000000000000000000000');
    expect(missing.status).toBe(404);

    const malformed = await request(app).get('/api/items/not-an-id');
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

    const detail = await request(app).get(`/api/items/${id}`);
    expect(detail.body.data.item.title).toBe('Black wallet');
  });

  it('rejects deletes from a different user with 403', async () => {
    const owner = await registerUser();
    const other = await registerUser({ email: 'other@example.com' });
    const { id } = await createItem(owner);

    const res = await request(app).delete(`/api/items/${id}`).set('Cookie', other.cookie);
    expect(res.status).toBe(403);

    const detail = await request(app).get(`/api/items/${id}`);
    expect(detail.body.data.item.status).toBe('ACTIVE');
  });

  it('soft-closes the owner listing on delete', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    const res = await request(app).delete(`/api/items/${id}`).set('Cookie', owner.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.item.status).toBe('CLOSED');
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
      .field('description', 'This listing attaches a file that is not an image at all.')
      .field('category', 'OTHER')
      .field('locationLabel', 'Office')
      .field('dateFound', '2026-10-30')
      .attach('images', Buffer.from('%PDF-1.7 fake'), 'doc.pdf');

    expect(res.status).toBe(415);
  });

  it('rejects files whose content does not match an image format', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/items')
      .set('Cookie', user.cookie)
      .field('title', 'Spoofed image')
      .field('description', 'This file claims to be a PNG but contains arbitrary non-image bytes.')
      .field('category', 'OTHER')
      .field('locationLabel', 'Office')
      .field('dateFound', '2026-10-30')
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
      .field('description', 'This listing tries to attach an image bigger than the allowed limit.')
      .field('category', 'OTHER')
      .field('locationLabel', 'Office')
      .field('dateFound', '2026-10-30')
      .attach('images', oversized, 'huge.png');

    expect(res.status).toBe(413);
  });
});
