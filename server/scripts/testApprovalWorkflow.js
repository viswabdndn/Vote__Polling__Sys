require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

const authRoutes = require('../routes/authRoutes');
const pollRoutes = require('../routes/pollRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const runApprovalTests = async () => {
  await connectDB();
  console.log('🧪 Starting Poll Approval Gate & RBAC Test Suite...\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/polls', pollRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const PORT = 5098;
  const server = app.listen(PORT);

  const request = async (path, options = {}) => {
    const url = `http://localhost:${PORT}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      testFailed++;
    }
  };

  try {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['test_creator@test.com', 'test_participant@test.com', 'test_admin@test.com'] } });
    await Poll.deleteMany({ title: { $regex: /^\[TEST\]/ } });

    // Register Creator
    console.log('--- Phase 1: Authentication & Account Setup ---');
    const creatorReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Creator',
        email: 'test_creator@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        voterId: 'CREATOR01',
        role: 'creator',
      },
    });
    const creatorToken = creatorReg.data.token;
    assert(creatorReg.status === 201 && creatorToken, 'Creator registers successfully and receives JWT');

    // Register Participant
    const participantReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Participant',
        email: 'test_participant@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        voterId: 'VOTER01',
      },
    });
    const participantToken = participantReg.data.token;
    assert(participantReg.status === 201 && participantToken, 'Participant registers successfully and receives JWT');

    // Setup Test Admin directly in DB
    await User.create({
      name: 'Test Administrator',
      email: 'test_admin@test.com',
      password: 'Password123!',
      voterId: 'ADMIN01',
      role: 'admin',
      isActive: true,
    });
    // Login as Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test_admin@test.com',
        password: 'Password123!',
      },
    });
    const adminToken = adminLogin.data.token;
    assert(adminLogin.status === 200 && adminToken, 'Admin logs in successfully and receives JWT');

    // Phase 2: Creator Creates Poll -> Approval Status must be 'pending'
    console.log('\n--- Phase 2: Creator Creates Poll (Pending Gate) ---');
    const pollSubmission = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[TEST] Proposed Robotics Lab Expansion Project',
        description: 'Should the department expand robotics testing facilities?',
        expiryTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        options: ['Yes, fully expand', 'No, allocate to AI clusters', 'Undecided'],
      },
    });

    assert(pollSubmission.status === 201, 'Poll created successfully (HTTP 201)');
    const createdPoll = pollSubmission.data.poll;
    assert(createdPoll.approvalStatus === 'pending', 'Poll approvalStatus is set to "pending"');
    assert(pollSubmission.data.message.includes('approval'), 'Response informs creator that poll is pending approval');

    // Phase 3: Public / Participant Isolation Check
    console.log('\n--- Phase 3: Voting Gating for Pending Poll ---');
    const activePollsRes = await request('/api/polls/active', {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    const activeIds = (activePollsRes.data.polls || []).map((p) => p._id);
    assert(!activeIds.includes(createdPoll._id), 'Pending poll is NOT exposed in /api/polls/active');

    // Participant tries to vote on pending poll -> must return 403 Forbidden
    const firstOptionId = createdPoll.options[0]._id;
    const voteAttempt = await request(`/api/polls/${createdPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${participantToken}` },
      body: {
        optionId: firstOptionId,
      },
    });
    assert(voteAttempt.status === 403, 'Participant voting on pending poll is blocked (HTTP 403 Forbidden)');
    assert(voteAttempt.data.message.includes('approval'), 'Error message states poll is awaiting admin approval');

    // Phase 4: Non-Admin Access Control on Admin Approval Routes
    console.log('\n--- Phase 4: RBAC Security on Approval Endpoints ---');
    const creatorPendingAccess = await request('/api/admin/polls/pending', {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert(creatorPendingAccess.status === 403, 'Creator blocked from accessing /api/admin/polls/pending (HTTP 403)');

    const participantApproveAttempt = await request(`/api/admin/polls/${createdPoll._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    assert(participantApproveAttempt.status === 403, 'Participant blocked from approving poll (HTTP 403)');

    // Phase 5: Admin Approves Poll
    console.log('\n--- Phase 5: Admin Review & Approval Workflow ---');
    const adminPendingRes = await request('/api/admin/polls/pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPendingRes.status === 200, 'Admin can view pending queue');
    const pendingInQueue = adminPendingRes.data.polls.find((p) => p._id === createdPoll._id);
    assert(Boolean(pendingInQueue), 'Newly created creator poll is in Admin pending queue');

    // Admin approves with modified options
    const approveRes = await request(`/api/admin/polls/${createdPoll._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: '[TEST] Proposed Robotics Lab Expansion Project (Verified)',
        options: ['Yes, fully expand robotics', 'No, allocate to AI clusters', 'Defer to next semester'],
      },
    });

    assert(approveRes.status === 200, 'Admin approves poll with options (HTTP 200)');
    assert(approveRes.data.poll.approvalStatus === 'approved', 'Poll status updated to "approved"');
    assert(approveRes.data.poll.status === 'active', 'Poll status updated to "active"');
    assert(approveRes.data.poll.title.includes('Verified'), 'Admin modifications saved correctly');

    // Phase 6: Participant Can Now Vote on Approved Poll
    console.log('\n--- Phase 6: Voting On Approved Poll ---');
    const activePollsAfterApproval = await request('/api/polls/active', {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    const foundApproved = (activePollsAfterApproval.data.polls || []).find((p) => p._id === createdPoll._id);
    assert(Boolean(foundApproved), 'Approved poll now appears in /api/polls/active');

    const updatedOptions = approveRes.data.poll.options;
    const voteSuccess = await request(`/api/polls/${createdPoll._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${participantToken}` },
      body: {
        optionId: updatedOptions[0]._id,
      },
    });
    assert(voteSuccess.status === 201, 'Participant successfully votes on approved poll (HTTP 201)');

    // Phase 7: Rejection Workflow
    console.log('\n--- Phase 7: Admin Rejection with Feedback ---');
    const rejectPollSubmission = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
      body: {
        title: '[TEST] Duplicate cafeteria menu poll',
        description: 'Duplicate survey test',
        expiryTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        options: ['Option A', 'Option B'],
      },
    });
    const secondPoll = rejectPollSubmission.data.poll;

    const rejectionRes = await request(`/api/admin/polls/${secondPoll._id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reason: 'Duplicate topic: an official cafeteria poll was already completed this week.',
      },
    });

    assert(rejectionRes.status === 200, 'Admin rejects poll (HTTP 200)');
    assert(rejectionRes.data.poll.approvalStatus === 'rejected', 'Poll marked as "rejected"');
    assert(rejectionRes.data.poll.rejectionReason.includes('Duplicate topic'), 'Rejection reason recorded');

    // Creator checks /api/polls/my
    const myPollsRes = await request('/api/polls/my', {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    const rejectedInMyPolls = myPollsRes.data.polls.find((p) => p._id === secondPoll._id);
    assert(Boolean(rejectedInMyPolls), 'Rejected poll present in creator /api/polls/my');
    assert(rejectedInMyPolls.rejectionReason.includes('Duplicate topic'), 'Creator can see rejection feedback');

    // Clean up test data
    await User.deleteMany({ email: { $in: ['test_creator@test.com', 'test_participant@test.com', 'test_admin@test.com'] } });
    await Poll.deleteMany({ title: { $regex: /^\[TEST\]/ } });

    console.log(`\n========================================`);
    console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
    console.log(`========================================\n`);

    server.close(() => {
      mongoose.disconnect().then(() => {
        process.exit(testFailed > 0 ? 1 : 0);
      });
    });
  } catch (err) {
    console.error('❌ Test execution error:', err);
    server.close(() => {
      mongoose.disconnect().then(() => {
        process.exit(1);
      });
    });
  }
};

runApprovalTests();
