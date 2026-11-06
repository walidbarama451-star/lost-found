import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createItem, registerUser, submitClaim } from './helpers.js';

describe('notifications', () => {
  it('lists only the current user notifications', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id);

    const mine = await request(app).get('/api/notifications').set('Cookie', claimant.cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data.items).toHaveLength(0);

    const theirs = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(theirs.body.data.items).toHaveLength(1);
    expect(theirs.body.data.unreadCount).toBe(1);

    const strangers = await request(app).get('/api/notifications').set('Cookie', stranger.cookie);
    expect(strangers.body.data.items).toHaveLength(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('marks a single notification as read for its owner', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id);

    const list = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    const notificationId = list.body.data.items[0].id as string;

    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Cookie', owner.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.notification.read).toBe(true);

    const after = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(after.body.data.unreadCount).toBe(0);
  });

  it('does not let another user mark my notification read', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id);

    const list = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    const notificationId = list.body.data.items[0].id as string;

    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Cookie', stranger.cookie);
    expect(res.status).toBe(404);

    const stillUnread = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(stillUnread.body.data.unreadCount).toBe(1);
  });

  it('marks all of my notifications read without touching others', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id, 'First private claim message.');
    const second = await createItem(owner, { title: 'Second listing item' });
    await submitClaim(claimant, second.id);

    const ownerList = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(ownerList.body.data.items.length).toBeGreaterThanOrEqual(2);

    const res = await request(app).patch('/api/notifications/read-all').set('Cookie', owner.cookie);
    expect(res.status).toBe(200);

    const after = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(after.body.data.unreadCount).toBe(0);

    // The claimant's notifications are untouched.
    const claimantAfter = await request(app).get('/api/notifications').set('Cookie', claimant.cookie);
    expect(claimantAfter.body.data.unreadCount).toBe(0); // claimant has none at all
  });

  it('never leaks private claim details in notification text', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id, 'SECRET-PROOF-42 unique engraving under the lid.');

    const list = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(JSON.stringify(list.body)).not.toContain('SECRET-PROOF-42');
    expect(list.body.data.items[0].message).toContain('claim');
  });

  it('paginates notifications', async () => {
    const owner = await registerUser();
    for (let index = 0; index < 3; index += 1) {
      const claimant = await registerUser({ email: `claimant${index}@example.com` });
      const { id } = await createItem(owner, { title: `Listing for claim ${index}` });
      await submitClaim(claimant, id);
    }

    const firstPage = await request(app).get('/api/notifications?page=1&limit=2').set('Cookie', owner.cookie);
    expect(firstPage.body.data.items).toHaveLength(2);
    expect(firstPage.body.data.pagination).toMatchObject({ total: 3, totalPages: 2 });
  });
});
