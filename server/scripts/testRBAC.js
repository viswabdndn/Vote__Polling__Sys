require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const connectDB = require('../config/db');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

const authRoutes = require('../routes/authRoutes');
const pollRoutes = require('../routes/pollRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const runTests = async () => {
  await connectDB();
  console.log('🧪 Starting RBAC automated security and functional test suite...\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/polls', pollRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5099);

  const request = async (path, options = {}) => {
    const url = `http://localhost:5099${path}`;
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
    // 1. Setup clean test users
    console.log('--- Test Group 1: Registration Security ---');
    await User.deleteMany({ email: { $in: ['testadmin@test.com', 'creator_a@test.com', 'creator_b@test.com', 'voter_c@test.com'] } });

    // Try registering as admin directly through public API -> MUST FAIL
    const adminRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Hacker Admin',
        email: 'hacker@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'admin',
      },
    });
    assert(adminRegRes.status === 403, 'Public registration rejects role=admin (403)');

    // Register Creator A
    const creatorARes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Creator A',
        email: 'creator_a@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'creator',
      },
    });
    assert(creatorARes.status === 201 && creatorARes.data.user.role === 'creator', 'Creator A registered successfully with role=creator');
    const tokenA = creatorARes.data.token;
    const creatorAId = creatorARes.data.user._id;

    // Register Creator B
    const creatorBRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Creator B',
        email: 'creator_b@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'creator',
      },
    });
    assert(creatorBRes.status === 201 && creatorBRes.data.user.role === 'creator', 'Creator B registered successfully');
    const tokenB = creatorBRes.data.token;

    // Register Participant C
    const voterCRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Participant C',
        email: 'voter_c@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'participant',
      },
    });
    assert(voterCRes.status === 201 && voterCRes.data.user.role === 'participant', 'Participant C registered successfully');
    const tokenC = voterCRes.data.token;

    // Create Test Admin directly
    const testAdmin = await User.create({
      name: 'System Admin',
      email: 'testadmin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
    });
    const loginAdminRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'testadmin@test.com',
        password: 'password123',
      },
    });
    assert(loginAdminRes.status === 200 && loginAdminRes.data.user.role === 'admin', 'Admin logged in successfully');
    const tokenAdmin = loginAdminRes.data.token;

    console.log('\n--- Test Group 2: Admin API Route Protection ---');
    // Participant accessing /api/admin/stats -> MUST FAIL (403)
    const partStatsRes = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(partStatsRes.status === 403, 'Participant denied access to /api/admin/stats (403)');

    // Creator accessing /api/admin/stats -> MUST FAIL (403)
    const creatorStatsRes = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(creatorStatsRes.status === 403, 'Creator denied access to /api/admin/stats (403)');

    // Admin accessing /api/admin/stats -> SUCCESS (200)
    const adminStatsRes = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminStatsRes.status === 200 && adminStatsRes.data.stats.totalUsers >= 4, 'Admin successfully fetched /api/admin/stats');

    console.log('\n--- Test Group 3: Poll Creation & Ownership Isolation ---');
    // Participant trying to create a poll -> MUST FAIL (403)
    const partCreateRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenC}` },
      body: {
        title: 'Unauthorized Participant Poll',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['Yes', 'No'],
      },
    });
    assert(partCreateRes.status === 403, 'Participant denied from creating polls (403)');

    // Creator A creates a poll -> SUCCESS (201)
    const pollCreateRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Creator A Tech Poll',
        description: 'Testing permissions',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['JavaScript', 'TypeScript'],
      },
    });
    assert(pollCreateRes.status === 201, 'Creator A successfully created poll');
    const pollAId = pollCreateRes.data.poll._id;

    // Creator B trying to edit Creator A's poll -> MUST FAIL (403)
    const bEditRes = await request(`/api/polls/${pollAId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { title: 'Hijacked by Creator B' },
    });
    assert(bEditRes.status === 403, 'Creator B denied from editing Creator A poll (403 ownership check)');

    // Creator B trying to delete Creator A's poll -> MUST FAIL (403)
    const bDeleteRes = await request(`/api/polls/${pollAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bDeleteRes.status === 403, 'Creator B denied from deleting Creator A poll (403 ownership check)');

    // Creator A editing their own poll -> SUCCESS (200)
    const aEditRes = await request(`/api/polls/${pollAId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { title: 'Creator A Updated Title' },
    });
    assert(aEditRes.status === 200 && aEditRes.data.poll.title === 'Creator A Updated Title', 'Creator A can edit their own poll');

    console.log('\n--- Test Group 4: Admin Permission Granular Controls ---');
    // Admin revokes canCreatePoll for Creator A
    const revokeRes = await request(`/api/admin/creators/${creatorAId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { canCreatePoll: false },
    });
    assert(revokeRes.status === 200 && revokeRes.data.user.creatorPermissions.canCreatePoll === false, 'Admin revoked canCreatePoll for Creator A');

    // Creator A attempts to create poll with revoked permission -> MUST FAIL (403)
    const blockedCreateRes = await request('/api/polls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Blocked Poll Attempt',
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        options: ['A', 'B'],
      },
    });
    assert(blockedCreateRes.status === 403, 'Creator A blocked from creating poll when canCreatePoll is false (403)');

    // Admin restores canCreatePoll
    await request(`/api/admin/creators/${creatorAId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { canCreatePoll: true },
    });

    // Admin deactivates Creator A
    const deactRes = await request(`/api/admin/creators/${creatorAId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { isActive: false },
    });
    assert(deactRes.status === 200 && deactRes.data.user.isActive === false, 'Admin deactivated Creator A account');

    // Creator A tries any authenticated action -> MUST FAIL (403)
    const deactActionRes = await request('/api/polls/my', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deactActionRes.status === 403, 'Deactivated Creator A is immediately blocked (403)');

    // Creator A tries to login while deactivated -> MUST FAIL (403)
    const deactLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'creator_a@test.com', password: 'password123' },
    });
    assert(deactLoginRes.status === 403, 'Deactivated Creator A cannot log in (403)');

    // Re-activate Creator A
    await request(`/api/admin/creators/${creatorAId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { isActive: true },
    });

    console.log('\n--- Test Group 5: Admin Full Management Powers ---');
    // Admin can edit Creator A's poll directly
    const adminEditRes = await request(`/api/polls/${pollAId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { title: 'Poll Title Overridden By Administrator' },
    });
    assert(adminEditRes.status === 200, 'Admin can edit any poll directly');

    // Admin can delete any poll
    const adminDeleteRes = await request(`/api/polls/${pollAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminDeleteRes.status === 200, 'Admin can delete any poll directly');

    // Cleanup test data
    await User.deleteMany({ email: { $in: ['testadmin@test.com', 'creator_a@test.com', 'creator_b@test.com', 'voter_c@test.com'] } });
    await Poll.deleteMany({ title: /Creator A/ });

    console.log(`\n========================================`);
    console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
    console.log(`========================================\n`);

    server.close();
    process.exit(testFailed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
};

runTests();
