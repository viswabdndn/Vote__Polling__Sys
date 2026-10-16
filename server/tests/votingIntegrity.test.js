const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Poll = require('../src/models/Poll');
const Option = require('../src/models/Option');
const Vote = require('../src/models/Vote');
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

describe('Voting Integrity & Double-Voting Prevention Suite', () => {
  let userToken;
  let user2Token;
  let activePoll;
  let options;

  beforeEach(async () => {
    // 1. Create Users
    const u1 = await User.create({
      name: 'Voter One',
      email: 'voter1@test.local',
      password: 'Password123!',
      role: 'participant',
    });
    const log1 = await request(app).post('/api/auth/login').send({ email: u1.email, password: 'Password123!' });
    userToken = log1.body.token;

    const u2 = await User.create({
      name: 'Voter Two',
      email: 'voter2@test.local',
      password: 'Password123!',
      role: 'participant',
    });
    const log2 = await request(app).post('/api/auth/login').send({ email: u2.email, password: 'Password123!' });
    user2Token = log2.body.token;

    // 2. Create Active Approved Poll
    activePoll = await Poll.create({
      title: 'Best Frontend Framework 2026',
      createdBy: u1._id,
      status: 'active',
      approvalStatus: 'approved',
      expiryTime: new Date(Date.now() + 24 * 3600 * 1000),
    });

    options = await Option.insertMany([
      { pollId: activePoll._id, text: 'React' },
      { pollId: activePoll._id, text: 'Vue' },
      { pollId: activePoll._id, text: 'Svelte' },
    ]);
  });

  test('POST /api/polls/:pollId/vote - Should cast vote successfully', async () => {
    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.results.totalVotes).toBe(1);

    const voteInDb = await Vote.findOne({ pollId: activePoll._id });
    expect(voteInDb).not.toBeNull();
  });

  test('POST /api/polls/:pollId/vote - Should reject second vote from same user with HTTP 409', async () => {
    // First vote
    await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    // Second vote attempt
    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[1]._id });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);

    // Verify only 1 vote exists in DB
    const totalVotes = await Vote.countDocuments({ pollId: activePoll._id });
    expect(totalVotes).toBe(1);
  });

  test('POST /api/polls/:pollId/vote - Double-vote concurrency race handles duplicate gracefully', async () => {
    // Fire two concurrent requests for the same user
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/polls/${activePoll._id}/vote`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ optionId: options[0]._id }),
      request(app)
        .post(`/api/polls/${activePoll._id}/vote`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ optionId: options[0]._id }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const totalVotes = await Vote.countDocuments({ pollId: activePoll._id });
    expect(totalVotes).toBe(1);
  });

  test('POST /api/polls/:pollId/vote - Should reject voting on closed poll with HTTP 403', async () => {
    activePoll.status = 'closed';
    await activePoll.save();

    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls/:pollId/vote - Should reject voting on expired poll with HTTP 403', async () => {
    activePoll.expiryTime = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    await activePoll.save();

    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls/:pollId/vote - Should reject voting on pending unapproved poll with HTTP 403', async () => {
    activePoll.approvalStatus = 'pending';
    await activePoll.save();

    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/polls/:pollId/results - Aggregation computes accurate percentages without count drift', async () => {
    // User 1 votes for React
    await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ optionId: options[0]._id });

    // User 2 votes for Vue
    await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ optionId: options[1]._id });

    const res = await request(app)
      .get(`/api/polls/${activePoll._id}/results`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalVotes).toBe(2);

    const reactOpt = res.body.options.find((o) => o.text === 'React');
    const vueOpt = res.body.options.find((o) => o.text === 'Vue');
    const svelteOpt = res.body.options.find((o) => o.text === 'Svelte');

    expect(reactOpt.voteCount).toBe(1);
    expect(reactOpt.percentage).toBe(50);
    expect(vueOpt.voteCount).toBe(1);
    expect(vueOpt.percentage).toBe(50);
    expect(svelteOpt.voteCount).toBe(0);
    expect(svelteOpt.percentage).toBe(0);
  });
});
