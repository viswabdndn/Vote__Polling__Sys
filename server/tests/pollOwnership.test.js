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

describe('Poll Ownership & Access Control Suite', () => {
  let adminToken;
  let creatorAToken;
  let creatorBToken;
  let participantToken;
  let pollA;

  beforeEach(async () => {
    // Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@system.local',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    const aLog = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'AdminPassword123!' });
    adminToken = aLog.body.token;

    // Creator A
    const creatorA = await User.create({
      name: 'Creator Alice',
      email: 'alice@creators.local',
      password: 'CreatorPassword123!',
      role: 'creator',
      creatorPermissions: { canCreatePoll: true, canEditPoll: true, canPublishPoll: true, canDeletePoll: true },
    });
    const cALog = await request(app).post('/api/auth/login').send({ email: creatorA.email, password: 'CreatorPassword123!' });
    creatorAToken = cALog.body.token;

    // Creator B
    const creatorB = await User.create({
      name: 'Creator Bob',
      email: 'bob@creators.local',
      password: 'CreatorPassword123!',
      role: 'creator',
      creatorPermissions: { canCreatePoll: true, canEditPoll: true, canPublishPoll: true, canDeletePoll: true },
    });
    const cBLog = await request(app).post('/api/auth/login').send({ email: creatorB.email, password: 'CreatorPassword123!' });
    creatorBToken = cBLog.body.token;

    // Participant
    const participant = await User.create({
      name: 'Participant Charlie',
      email: 'charlie@users.local',
      password: 'UserPassword123!',
      role: 'participant',
    });
    const pLog = await request(app).post('/api/auth/login').send({ email: participant.email, password: 'UserPassword123!' });
    participantToken = pLog.body.token;

    // Poll belonging to Creator A
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
    pollA = await Poll.create({
      title: "Alice's Quantum Computing Poll",
      createdBy: creatorA._id,
      status: 'active',
      approvalStatus: 'approved',
      expiryTime: futureDate,
    });
    await Option.insertMany([
      { pollId: pollA._id, text: 'Superconducting' },
      { pollId: pollA._id, text: 'Trapped Ion' },
    ]);
  });

  test("Creator A can edit their own poll", async () => {
    const res = await request(app)
      .put(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${creatorAToken}`)
      .send({ title: "Alice's Updated Quantum Computing Poll" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.poll.title).toBe("Alice's Updated Quantum Computing Poll");
  });

  test("Creator B cannot edit Creator A's poll (HTTP 403)", async () => {
    const res = await request(app)
      .put(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${creatorBToken}`)
      .send({ title: "Bob Hijacks Alice's Poll" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("Creator B cannot delete Creator A's poll (HTTP 403)", async () => {
    const res = await request(app)
      .delete(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${creatorBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("Admin can edit any creator's poll", async () => {
    const res = await request(app)
      .put(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Moderated Quantum Poll' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.poll.title).toBe('Admin Moderated Quantum Poll');
  });

  test("Admin can delete any creator's poll", async () => {
    const res = await request(app)
      .delete(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Poll.findById(pollA._id);
    expect(check).toBeNull();
  });

  test("Participant cannot edit or delete any poll (HTTP 403)", async () => {
    const editRes = await request(app)
      .put(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ title: 'Participant Edit Attempt' });
    expect(editRes.status).toBe(403);

    const delRes = await request(app)
      .delete(`/api/polls/${pollA._id}`)
      .set('Authorization', `Bearer ${participantToken}`);
    expect(delRes.status).toBe(403);
  });
});
