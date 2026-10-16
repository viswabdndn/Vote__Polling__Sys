const request = require('supertest');
const app = require('../src/app');
const dbHandler = require('./dbHandler');

beforeAll(async () => {
  await dbHandler.connect();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe('Authentication & Security Suite', () => {
  const validUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'participant',
  };

  test('POST /api/auth/register - Should register user successfully with valid details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('participant');
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/register - Should register user with voterId (no email provided)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Student',
        voterId: '24104999',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.voterId).toBe('24104999');
    expect(res.body.user.email).toBe('24104999@poll.local');
  });

  test('POST /api/auth/register - Should reject weak password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUser,
        password: 'Pw1',
        confirmPassword: 'Pw1',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - Should reject password without uppercase/lowercase/digit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUser,
        password: 'passwordonly',
        confirmPassword: 'passwordonly',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - Should reject mismatched confirmPassword', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUser,
        confirmPassword: 'DifferentPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - Should reject public registration with role=admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUser,
        role: 'admin',
      });

    expect([400, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - Should reject duplicate email with HTTP 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Should log in successfully with email', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
  });

  test('POST /api/auth/login - Should reject invalid password with HTTP 401', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - Should return current user when authenticated with token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validUser.email);
  });

  test('GET /api/auth/me - Should reject unauthenticated requests with HTTP 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
