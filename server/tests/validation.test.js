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

describe('Input Validation & Boundary Testing Suite', () => {
  let creatorToken;
  let activePoll;
  let validOption;

  beforeEach(async () => {
    const creator = await User.create({
      name: 'Creator Prof',
      email: 'creator@validation.local',
      password: 'CreatorPassword123!',
      role: 'creator',
      creatorPermissions: { canCreatePoll: true, canEditPoll: true, canPublishPoll: true, canDeletePoll: true },
    });
    const log = await request(app).post('/api/auth/login').send({ email: creator.email, password: 'CreatorPassword123!' });
    creatorToken = log.body.token;

    activePoll = await Poll.create({
      title: 'Valid Base Poll For Option Tests',
      createdBy: creator._id,
      status: 'active',
      approvalStatus: 'approved',
      expiryTime: new Date(Date.now() + 24 * 3600 * 1000),
    });

    validOption = await Option.create({
      pollId: activePoll._id,
      text: 'Option 1',
    });
  });

  test('POST /api/polls - Rejects poll title shorter than 5 chars', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Hi',
        options: ['Choice 1', 'Choice 2'],
        expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Rejects poll with fewer than 2 options', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Valid Poll Title Here',
        options: ['Only One Option'],
        expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Rejects poll with more than 10 options', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Too Many Options Poll',
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
        expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Rejects poll with duplicate option names (case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Duplicate Options Poll',
        options: ['Option A', 'option a'],
        expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls - Rejects poll with past expiry date', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Past Expiry Poll',
        options: ['A', 'B'],
        expiryTime: new Date(Date.now() - 10000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls/:pollId/vote - Rejects vote if optionId does not belong to poll', async () => {
    const otherPoll = await Poll.create({
      title: 'Other Poll Entirely',
      createdBy: activePoll.createdBy,
      status: 'active',
      approvalStatus: 'approved',
      expiryTime: new Date(Date.now() + 24 * 3600 * 1000),
    });
    const foreignOption = await Option.create({
      pollId: otherPoll._id,
      text: 'Foreign Option',
    });

    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ optionId: foreignOption._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/polls/:pollId/vote - Rejects malformed optionId format', async () => {
    const res = await request(app)
      .post(`/api/polls/${activePoll._id}/vote`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ optionId: 'not-a-mongo-id' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
