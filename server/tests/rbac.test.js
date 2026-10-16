const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Poll = require('../src/models/Poll');
const Option = require('../src/models/Option');
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

describe('Role-Based Access Control (RBAC) Suite', () => {
  let adminToken;
  let adminUser;
  let creatorToken;
  let participantToken;
  let creatorUser;

  beforeEach(async () => {
    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@system.local',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true,
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@system.local', password: 'AdminPassword123!' });
    adminToken = adminLogin.body.token;

    // 2. Create Creator
    creatorUser = await User.create({
      name: 'Prof. Creator',
      email: 'creator@college.local',
      password: 'CreatorPassword123!',
      role: 'creator',
      isActive: true,
      creatorPermissions: {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      },
    });
    const creatorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'creator@college.local', password: 'CreatorPassword123!' });
    creatorToken = creatorLogin.body.token;

    // 3. Create Participant
    await User.create({
      name: 'Student Participant',
      email: 'student@college.local',
      password: 'StudentPassword123!',
      role: 'participant',
      isActive: true,
    });
    const participantLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.local', password: 'StudentPassword123!' });
    participantToken = participantLogin.body.token;
  });

  test('GET /api/admin/stats - Admin should be permitted access', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
  });

  test('GET /api/admin/stats - Creator should be denied access with HTTP 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/admin/stats - Participant should be denied access with HTTP 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${participantToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Creator should be permitted to create poll (submitted for review)', async () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Midterm Feedback Poll',
        description: 'Semester check-in',
        options: ['Excellent', 'Good', 'Needs Improvement'],
        expiryTime: futureDate,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.poll.approvalStatus).toBe('pending');
  });

  test('POST /api/polls - Participant should be forbidden from creating polls with HTTP 403', async () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        title: 'Participant Sneak Poll',
        options: ['Yes', 'No'],
        expiryTime: futureDate,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Revoked creator permission (canCreatePoll=false) gets HTTP 403', async () => {
    creatorUser.creatorPermissions.canCreatePoll = false;
    await creatorUser.save();

    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Revoked Creator Poll',
        options: ['Option A', 'Option B'],
        expiryTime: futureDate,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls/:pollId/vote - Admin should be forbidden from voting with HTTP 403', async () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
    const poll = await Poll.create({
      title: 'Admin No Vote Test Poll',
      createdBy: creatorUser._id,
      status: 'active',
      approvalStatus: 'approved',
      expiryTime: futureDate,
    });
    const option = await Option.create({
      pollId: poll._id,
      text: 'Option 1',
    });

    const res = await request(app)
      .post(`/api/polls/${poll._id}/vote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ optionId: option._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/admin/users/:id/status - Admin cannot deactivate the last active admin', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${adminUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot deactivate/i);
  });

  test('DELETE /api/admin/users/:id - Admin cannot delete the last remaining admin', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete/i);
  });

  test('PUT /api/admin/users/:id/role - Admin cannot demote the last remaining admin', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${adminUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'participant' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot demote/i);
  });

  test('POST /api/admin/creators - Admin can create a new creator account successfully', async () => {
    const res = await request(app)
      .post('/api/admin/creators')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. New Creator',
        email: 'newcreator@adminsetup.local',
        password: 'Password123!',
        voterId: 'CR9999',
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: false,
        canDeletePoll: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.creator.name).toBe('Dr. New Creator');
    expect(res.body.creator.role).toBe('creator');
    expect(res.body.creator.creatorPermissions.canCreatePoll).toBe(true);
    expect(res.body.creator.creatorPermissions.canPublishPoll).toBe(false);

    // Verify creator can actually log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newcreator@adminsetup.local', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('creator');
  });

  test('POST /api/admin/creators - Non-admin is blocked with HTTP 403', async () => {
    const res = await request(app)
      .post('/api/admin/creators')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        name: 'Hacker Creator',
        email: 'hacker@test.local',
        password: 'Password123!',
      });

    expect(res.status).toBe(403);
  });

  test('POST /api/admin/creators - Rejects duplicate email with HTTP 409', async () => {
    const res = await request(app)
      .post('/api/admin/creators')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Creator',
        email: 'creator@college.local', // already registered in beforeEach
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
