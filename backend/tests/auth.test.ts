import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, cookieOf, registerUser } from './helpers.js';

describe('authentication', () => {
  it('registers a new account and returns a safe user object', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'sam',
      discordUsername: 'sam_discord',
      email: 'Sam@Example.COM',
      password: 'StrongPassword123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      username: 'sam',
      discordUsername: 'sam_discord',
      email: 'sam@example.com',
    });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('role');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const cookie = res.headers['set-cookie'] as string[] | string;
    const cookies = Array.isArray(cookie) ? cookie : [cookie];
    const token = cookies.find((entry) => entry.startsWith('lost_and_found_token='));
    expect(token).toBeDefined();
    expect(token).toContain('HttpOnly');
    expect(token).toContain('SameSite=Lax');
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser({ email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'other',
        discordUsername: 'other_discord',
        email: 'dup@example.com',
        password: 'StrongPassword123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid registration input with field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', discordUsername: 'x', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('signs in with valid credentials and returns the same safe shape', async () => {
    await registerUser({ email: 'login@example.com', password: 'StrongPassword123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LOGIN@example.com', password: 'StrongPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a wrong password with a generic 401 message', async () => {
    await registerUser({ email: 'login@example.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects an unknown email with the same generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'StrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns the current user on /auth/me when authenticated', async () => {
    const user = await registerUser({ email: 'me@example.com' });
    const res = await request(app).get('/api/auth/me').set('Cookie', user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: user.id, email: 'me@example.com' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects /auth/me without a session cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const user = await registerUser();
    const forged = `${user.cookie.split('=')[0]}=eyJhbGciOiJIUzI1NiJ9.forgedy.signature`;
    const res = await request(app).get('/api/auth/me').set('Cookie', forged);
    expect(res.status).toBe(401);
  });

  it('clears the session cookie on logout', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/auth/logout').set('Cookie', user.cookie);

    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie'] as string[] | string;
    const cookies = Array.isArray(cookie) ? cookie : [cookie];
    expect(cookies.join(';')).toContain('lost_and_found_token=;');
  });
});

describe('profile', () => {
  it('updates allowed profile fields', async () => {
    const user = await registerUser({ email: 'profile@example.com' });
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', user.cookie)
      .send({ username: 'renamed_user', phone: '+213 555 010 101' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('renamed_user');
    expect(res.body.data.user.phone).toBe('+213 555 010 101');
  });

  it('never lets a user escalate their own role', async () => {
    const user = await registerUser({ email: 'sneaky@example.com' });
    const res = await request(app).patch('/api/users/me').set('Cookie', user.cookie).send({ role: 'ADMIN' });

    expect(res.status).toBe(400);

    const me = await request(app).get('/api/auth/me').set('Cookie', user.cookie);
    expect(me.body.data.user).not.toHaveProperty('role');
    expect(JSON.stringify(me.body)).not.toContain('ADMIN');
  });

  it('requires authentication for profile access', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('rejects a duplicate email change with 409', async () => {
    await registerUser({ email: 'taken@example.com' });
    const user = await registerUser({ email: 'mine@example.com' });
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', user.cookie)
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(409);
  });

  it('exposes the session cookie helper', async () => {
    const user = await registerUser();
    expect(user.cookie).toContain('lost_and_found_token=');
    expect(cookieOf).toBeTypeOf('function');
  });
});
