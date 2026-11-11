import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createItem, registerUser, submitClaim, type TestUser } from './helpers.js';

async function listItem(itemId: string) {
  const res = await request(app).get(`/api/items/${itemId}`);
  return res.body.data.item as { status: string };
}

describe('claim submission', () => {
  it('accepts a claim from another user and notifies the owner', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);

    const res = await submitClaim(claimant, id);
    expect(res.status).toBe(201);
    expect(res.body.data.claim.status).toBe('PENDING');

    const notifications = await request(app).get('/api/notifications').set('Cookie', owner.cookie);
    expect(notifications.body.data.items).toHaveLength(1);
    expect(notifications.body.data.items[0].type).toBe('CLAIM_SUBMITTED');
    expect(notifications.body.data.unreadCount).toBe(1);
  });

  it('never exposes the private claim message publicly', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id, 'My secret proof: serial number XJ-9912 and a scratch.');

    const anonymous = await request(app).get(`/api/items/${id}`);
    expect(JSON.stringify(anonymous.body)).not.toContain('serial number');

    const otherUser = await registerUser({ email: 'bystander@example.com' });
    const asUser = await request(app).get(`/api/items/${id}`).set('Cookie', otherUser.cookie);
    expect(JSON.stringify(asUser.body)).not.toContain('serial number');

    const list = await request(app).get('/api/items');
    expect(JSON.stringify(list.body)).not.toContain('serial number');
  });

  it('rejects claiming your own listing', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    const res = await submitClaim(owner, id);
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate pending claim from the same claimant', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);

    expect((await submitClaim(claimant, id)).status).toBe(201);
    const duplicate = await submitClaim(claimant, id);
    expect(duplicate.status).toBe(409);
  });

  it('rejects claims on listings that are not ACTIVE', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    await request(app).delete(`/api/items/${id}`).set('Cookie', owner.cookie);

    const res = await submitClaim(claimant, id);
    expect(res.status).toBe(409);
  });

  it('requires authentication', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);
    const res = await request(app).post('/api/claims').send({ itemId: id, message: 'hello there' });
    expect(res.status).toBe(401);
  });
});

describe('claim decisions', () => {
  it('lets only the listing owner accept or reject', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;

    const byStranger = await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', stranger.cookie)
      .send({ decision: 'ACCEPTED' });
    expect(byStranger.status).toBe(403);

    const byOwner = await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });
    expect(byOwner.status).toBe(200);
    expect(byOwner.body.data.claim.status).toBe('ACCEPTED');
  });

  it('moves the listing to CLAIMED on accept and notifies the claimant', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;

    await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });

    expect((await listItem(id)).status).toBe('CLAIMED');

    const notifications = await request(app).get('/api/notifications').set('Cookie', claimant.cookie);
    expect(notifications.body.data.items[0].type).toBe('CLAIM_ACCEPTED');
    // Notification must not contain the private proof details.
    expect(JSON.stringify(notifications.body)).not.toContain('scratch');
  });

  it('keeps the listing ACTIVE when a claim is rejected and notifies the claimant', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id, 'I can prove it with a mark on the back.')).body.data
      .claim;

    await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'REJECTED' });

    expect((await listItem(id)).status).toBe('ACTIVE');

    const notifications = await request(app).get('/api/notifications').set('Cookie', claimant.cookie);
    expect(notifications.body.data.items[0].type).toBe('CLAIM_REJECTED');
  });

  it('refuses a second decision on an already decided claim', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;

    const first = await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'REJECTED' });
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });
    expect(second.status).toBe(409);
  });

  it('accepts exactly one of two concurrent decisions on different claims', async () => {
    const owner = await registerUser();
    const claimantA: TestUser = await registerUser({ email: 'a@example.com' });
    const claimantB: TestUser = await registerUser({ email: 'b@example.com' });
    const { id } = await createItem(owner);

    const claimA = (await submitClaim(claimantA, id, 'First claimant unique mark A-1.')).body.data.claim;
    const claimB = (await submitClaim(claimantB, id, 'Second claimant unique mark B-2.')).body.data.claim;

    const [decisionA, decisionB] = await Promise.all([
      request(app)
        .patch(`/api/claims/${claimA.id}/decision`)
        .set('Cookie', owner.cookie)
        .send({ decision: 'ACCEPTED' }),
      request(app)
        .patch(`/api/claims/${claimB.id}/decision`)
        .set('Cookie', owner.cookie)
        .send({ decision: 'ACCEPTED' }),
    ]);

    const statuses = [decisionA.status, decisionB.status].sort();
    expect(statuses).toEqual([200, 409]);

    // The listing must have exactly one accepted claim.
    const item = await listItem(id);
    expect(item.status).toBe('CLAIMED');

    const mine = await request(app).get('/api/items/mine').set('Cookie', owner.cookie);
    const owned = mine.body.data.items.find((entry: { id: string }) => entry.id === id);
    expect(owned.acceptedClaim).toBeTruthy();

    const claims = await request(app).get(`/api/items/${id}/claims`).set('Cookie', owner.cookie);
    const accepted = claims.body.data.items.filter((c: { status: string }) => c.status === 'ACCEPTED');
    expect(accepted).toHaveLength(1);
  });

  it('rejects a decision when another claim already claimed the item', async () => {
    const owner = await registerUser();
    const claimantA: TestUser = await registerUser({ email: 'a@example.com' });
    const claimantB: TestUser = await registerUser({ email: 'b@example.com' });
    const { id } = await createItem(owner);

    const claimA = (await submitClaim(claimantA, id)).body.data.claim;
    const claimB = (await submitClaim(claimantB, id)).body.data.claim;

    const first = await request(app)
      .patch(`/api/claims/${claimA.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch(`/api/claims/${claimB.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });
    expect(second.status).toBe(409);

    // The rejected-race claim stays pending so the owner can still reject it.
    const reject = await request(app)
      .patch(`/api/claims/${claimB.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'REJECTED' });
    expect(reject.status).toBe(200);
  });
});

describe('claim visibility and withdrawal', () => {
  it('shows claims only to the listing owner', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    await submitClaim(claimant, id, 'Private details only the owner may read.');

    const asOwner = await request(app).get(`/api/items/${id}/claims`).set('Cookie', owner.cookie);
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.data.items).toHaveLength(1);
    expect(asOwner.body.data.items[0].claimant).toEqual({ id: claimant.id, username: claimant.username });

    const asStranger = await request(app).get(`/api/items/${id}/claims`).set('Cookie', stranger.cookie);
    expect(asStranger.status).toBe(403);

    const asClaimant = await request(app).get(`/api/items/${id}/claims`).set('Cookie', claimant.cookie);
    expect(asClaimant.status).toBe(403);
  });

  it('lets the claimant list their own claims and withdraw a pending one', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;

    const mine = await request(app).get('/api/claims/mine').set('Cookie', claimant.cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data.items).toHaveLength(1);
    expect(mine.body.data.items[0].item.id).toBe(id);

    const withdraw = await request(app)
      .patch(`/api/claims/${claim.id}/withdraw`)
      .set('Cookie', claimant.cookie);
    expect(withdraw.status).toBe(200);
    expect(withdraw.body.data.claim.status).toBe('WITHDRAWN');

    // After withdrawal a new claim is possible (only PENDING is unique).
    const again = await submitClaim(claimant, id);
    expect(again.status).toBe(201);
  });

  it('does not let another user withdraw someone else claim', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const stranger = await registerUser({ email: 'stranger@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;

    const res = await request(app).patch(`/api/claims/${claim.id}/withdraw`).set('Cookie', stranger.cookie);
    expect(res.status).toBe(403);
  });

  it('marks the listing RETURNED when the owner completes the handover', async () => {
    const owner = await registerUser();
    const claimant = await registerUser({ email: 'claimant@example.com' });
    const { id } = await createItem(owner);
    const claim = (await submitClaim(claimant, id)).body.data.claim;
    await request(app)
      .patch(`/api/claims/${claim.id}/decision`)
      .set('Cookie', owner.cookie)
      .send({ decision: 'ACCEPTED' });

    const returned = await request(app).patch(`/api/items/${id}/return`).set('Cookie', owner.cookie);
    expect(returned.status).toBe(200);
    expect(returned.body.data.item.status).toBe('RETURNED');
    expect(returned.body.data.item.returnedAt).toBeTruthy();

    // Returned listings disappear from public search results.
    const list = await request(app).get('/api/items');
    expect(list.body.data.items).toHaveLength(0);

    // The claimant learns the item was returned.
    const notifications = await request(app).get('/api/notifications').set('Cookie', claimant.cookie);
    const types = notifications.body.data.items.map((n: { type: string }) => n.type);
    expect(types).toContain('ITEM_RETURNED');
  });

  it('refuses to mark an item returned without an accepted claim', async () => {
    const owner = await registerUser();
    const { id } = await createItem(owner);

    const res = await request(app).patch(`/api/items/${id}/return`).set('Cookie', owner.cookie);
    expect(res.status).toBe(409);
  });
});
