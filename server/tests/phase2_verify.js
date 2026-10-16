require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const connectDB = require('../config/db');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

const authRoutes = require('../routes/authRoutes');
const pollRoutes = require('../routes/pollRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');
const { autoCloseExpiredPolls } = require('../services/pollExpiryService');

const runPhase2Tests = async () => {
  await connectDB();
  console.log('🧪 Starting Phase 2: Poll and Voting Integrity Test Suite...\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/polls', pollRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5097);

  const request = async (path, options = {}) => {
    const url = `http://localhost:5097${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // Clean previous test data
    await User.deleteMany({ email: { $in: ['p2_creator@test.com', 'p2_voter1@test.com', 'p2_voter2@test.com'] } });
    await Poll.deleteMany({ title: { $regex: /^\[P2_TEST\]/ } });

    // 1. Setup Creator and Voters
    console.log('--- Test Group 1: Setup Accounts ---');
    const creatorRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'P2 Creator',
        email: 'p2_creator@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'creator',
      },
    });
    assert(creatorRes.status === 201, 'Creator registered');
    const creatorToken = creatorRes.data.token;

    const voter1Res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Voter 1',
        email: 'p2_voter1@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        voterId: 'VOTER901',
      },
    });
    assert(voter1Res.status === 201, 'Voter 1 registered');
    const voter1Token = voter1Res.data.token;

    // 2. Poll Creation Validations
    console.log('\n--- Test Group 2: Poll Creation Validation Rules ---');
    // < 2 options -> Reject
    const fewOptionsRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[P2_TEST] Too Few Options',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['Single Option'],
      },
    });
    assert(fewOptionsRes.status === 400, 'Rejects poll creation with < 2 options (400)');

    // Duplicate options -> Reject
    const dupOptionsRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[P2_TEST] Duplicate Options Poll',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['Option A', 'option a'],
      },
    });
    assert(dupOptionsRes.status === 400, 'Rejects poll creation with duplicate options (400)');

    // Past expiry date -> Reject
    const pastExpiryRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[P2_TEST] Past Expiry Poll',
        expiryTime: new Date(Date.now() - 3600000).toISOString(),
        options: ['Yes', 'No'],
      },
    });
    assert(pastExpiryRes.status === 400, 'Rejects poll creation with past expiry date (400)');

    // > 10 options -> Reject
    const manyOptionsRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[P2_TEST] Too Many Options',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      },
    });
    assert(manyOptionsRes.status === 400, 'Rejects poll creation with > 10 options (400)');

    // Valid poll creation
    const validPollRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[P2_TEST] High Integrity Campus Survey',
        description: 'Testing voting integrity rules',
        expiryTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        options: ['Approve Budget', 'Request Revision'],
      },
    });
    assert(validPollRes.status === 201, 'Valid poll created successfully (201)');
    const testPoll = validPollRes.data.poll;
    const option1 = testPoll.options[0];
    const option2 = testPoll.options[1];

    // Approve poll in DB so it is eligible for voting
    await Poll.findByIdAndUpdate(testPoll._id, { approvalStatus: 'approved', status: 'active' });

    // 3. Voting Integrity & Race Condition (One Vote Per User)
    console.log('\n--- Test Group 3: One Vote Per User & Race Condition Defense ---');
    // Voter 1 casts vote -> SUCCESS (201)
    const vote1Res = await request(`/api/polls/${testPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${voter1Token}` },
      body: { optionId: option1._id },
    });
    assert(vote1Res.status === 201, 'Voter 1 successfully cast first vote (201)');

    // Voter 1 tries to vote again -> MUST FAIL (409)
    const doubleVoteRes = await request(`/api/polls/${testPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${voter1Token}` },
      body: { optionId: option2._id },
    });
    assert(doubleVoteRes.status === 409, 'Duplicate vote blocked with HTTP 409');
    assert(doubleVoteRes.data.message.includes('already voted'), 'Duplicate vote returns clear message');

    // Concurrent double-vote race condition simulation
    const concurrentAttempts = await Promise.all([
      request(`/api/polls/${testPoll._id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${voter1Token}` },
        body: { optionId: option1._id },
      }),
      request(`/api/polls/${testPoll._id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${voter1Token}` },
        body: { optionId: option2._id },
      }),
    ]);
    const allRejected = concurrentAttempts.every((r) => r.status === 409);
    assert(allRejected, 'Concurrent race-condition votes strictly rejected with HTTP 409');

    // 4. Server-Computed Aggregation Results & Zero Drift Check
    console.log('\n--- Test Group 4: Server Aggregation & Count Drift Prevention ---');
    const resultsRes = await request(`/api/polls/${testPoll._id}/results`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    });
    assert(resultsRes.status === 200, 'Fetched poll results');
    assert(resultsRes.data.totalVotes === 1, 'Total votes exactly matches Vote collection (1)');

    // Manually tamper with option.voteCount in DB to test self-healing drift reconciliation
    await Option.findByIdAndUpdate(option1._id, { voteCount: 999 });
    // Fetch results again -> buildResults must aggregate directly from Vote collection (1), not 999!
    const reconciledRes = await request(`/api/polls/${testPoll._id}/results`, {
      headers: { Authorization: `Bearer ${voter1Token}` },
    });
    assert(reconciledRes.data.totalVotes === 1, 'Results computed from Vote collection aggregation (ignores tampered option count)');
    const optResult = reconciledRes.data.options.find((o) => o._id === option1._id);
    assert(optResult.voteCount === 1, 'Option vote count correctly reports aggregated count (1)');

    // 5. Voting on Closed or Expired Polls
    console.log('\n--- Test Group 5: Expired and Closed Poll Protections ---');
    // Close the poll
    await Poll.findByIdAndUpdate(testPoll._id, { status: 'closed' });
    const voteOnClosedRes = await request(`/api/polls/${testPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: { optionId: option1._id },
    });
    assert(voteOnClosedRes.status === 403, 'Voting on closed poll rejected with HTTP 403');

    // Create an expired poll in DB
    const expiredPoll = await Poll.create({
      title: '[P2_TEST] Immediate Expiry Poll',
      createdBy: testPoll.createdBy,
      startTime: new Date(Date.now() - 7200000),
      expiryTime: new Date(Date.now() - 3600000), // expired 1 hour ago
      status: 'active',
      approvalStatus: 'approved',
    });
    const expOption = await Option.create({ pollId: expiredPoll._id, text: 'Opt' });

    const voteOnExpiredRes = await request(`/api/polls/${expiredPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: { optionId: expOption._id },
    });
    assert(voteOnExpiredRes.status === 403, 'Voting on expired poll rejected with HTTP 403');

    // 6. Automated Expiry Service
    console.log('\n--- Test Group 6: Automated Expiry Service ---');
    const autoCloseTestPoll = await Poll.create({
      title: '[P2_TEST] Auto Close Background Test Poll',
      createdBy: testPoll.createdBy,
      startTime: new Date(Date.now() - 7200000),
      expiryTime: new Date(Date.now() - 1000), // expired 1s ago
      status: 'active',
      approvalStatus: 'approved',
    });
    const closedCount = await autoCloseExpiredPolls();
    assert(closedCount >= 1, `Auto-closed ${closedCount} expired poll(s) in background`);
    const checkPoll = await Poll.findById(autoCloseTestPoll._id);
    assert(checkPoll.status === 'closed', 'Expired poll status transitioned to "closed"');

    // 7. Pagination and Lean Queries
    console.log('\n--- Test Group 7: Pagination and Lean List Endpoints ---');
    const paginatedRes = await request('/api/polls?page=1&limit=2', {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert(paginatedRes.status === 200, 'Fetched paginated polls');
    assert(Boolean(paginatedRes.data.pagination), 'Pagination metadata present in response');
    assert(paginatedRes.data.pagination.page === 1, 'Pagination page = 1');
    assert(paginatedRes.data.pagination.limit === 2, 'Pagination limit = 2');

    console.log(`\n========================================`);
    console.log(`Phase 2 Tests: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('❌ Test runner caught error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runPhase2Tests();
