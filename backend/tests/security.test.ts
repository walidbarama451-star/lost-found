import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createItem, pngBuffer, registerUser, submitClaim } from './helpers.js';

describe('security and privacy', () => {
  it('never returns a password hash from any authentication endpoint', async () => {
    const user = await registerUser({ email: 'secure@example.com' });

    const responses = await Promise.all([
      request(app).get('/api/auth/me').set('Cookie', user.cookie),
      request(app).get('/api/users/me').set('Cookie', user.cookie),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'secure@example.com', password: 'StrongPassword123' }),
    ]);

    for (const res of responses) {
      expect(res.status).toBeLessThan(300);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    }
  });

  it('keeps claim messages out of every item response', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id, 'PROOF-TOKEN-77 the engraving says ARD-2019.');

    const endpoints = [
      request(app).get('/api/items'),
      request(app).get(`/api/items/${id}`),
      request(app).get(`/api/items/${id}`).set('Cookie', owner.cookie),
    ];
    for (const res of await Promise.all(endpoints)) {
      expect(JSON.stringify(res.body)).not.toContain('PROOF-TOKEN-77');
    }
  });

  it('does not expose other users claims', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id);

    const myClaims = await request(app).get('/api/claims/mine').set('Cookie', stranger.cookie);
    expect(myClaims.body.data.items).toHaveLength(0);
  });

  it('rejects cross-origin mutating requests', async () => {
    const user = await registerUser();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', user.cookie)
      .set('Origin', 'https://evil.example')
      .send({ username: 'hijacked_name' });

    expect(res.status).toBe(403);
  });

  it('accepts same-origin mutating requests', async () => {
    const user = await registerUser();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', user.cookie)
      .set('Origin', 'http://localhost:5173')
      .send({ username: 'legit_name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('legit_name');
  });

  it('requires a valid ObjectId for item mutations', async () => {
    const user = await registerUser();
    const res = await request(app)
      .patch('/api/items/not-an-object-id')
      .set('Cookie', user.cookie)
      .send({ title: 'Whatever' });
    expect(res.status).toBe(400);
  });

  it('does not accept a client-supplied owner on creation', async () => {
    const owner = await registerUser();
    const stranger = await registerUser({ email: 'stranger@example.com' });

    const res = await request(app)
      .post('/api/items')
      .set('Cookie', owner.cookie)
      .field('title', 'Owned by someone else?')
      .field('createdBy', stranger.id)
      .field('status', 'HIDDEN')
      .attach('images', pngBuffer(), 'x.png');

    expect(res.status).toBe(201);
    expect(res.body.data.item.owner.id).toBe(owner.id);
    expect(res.body.data.item.status).toBe('ACTIVE');
  });

  it('sends a request id header on every response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('rate limits repeated login attempts', async () => {
    let limited = false;
    for (let attempt = 0; attempt < 110; attempt += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `does-not-exist-${attempt}@example.com`, password: 'WrongPassword123' });
      if (res.status === 429) {
        limited = true;
        break;
      }
      expect(res.status).toBe(401);
    }
    expect(limited).toBe(true);
  });
});
