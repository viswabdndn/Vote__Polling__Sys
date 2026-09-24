require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Poll = require('./models/Poll');
const Option = require('./models/Option');
const Vote = require('./models/Vote');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting seed...');

  // Clear existing data
  await Vote.deleteMany({});
  await Option.deleteMany({});
  await Poll.deleteMany({});
  await User.deleteMany({});

  // Create test users with 7-digit Participant IDs and distinct roles
  const userA = await User.create({
    name: 'Alice Johnson',
    voterId: '24104110',
    email: '24104110@nec.edu.in',
    role: 'creator', // Poll Creator / Admin
    password: 'password123',
  });

  const userB = await User.create({
    name: 'Bob Smith',
    voterId: '24104111',
    email: '24104111@nec.edu.in',
    role: 'participant', // Participant / Voter
    password: 'password123',
  });

  console.log('✅ Users created');

  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expired = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  // Poll 1: Programming language (active)
  const poll1 = await Poll.create({
    title: 'Which programming language do you prefer?',
    description: 'Vote for your favorite programming language for web development.',
    createdBy: userA._id,
    startTime: now,
    expiryTime: inThreeDays,
    status: 'active',
  });

  await Option.insertMany([
    { pollId: poll1._id, text: 'JavaScript', voteCount: 0 },
    { pollId: poll1._id, text: 'Python', voteCount: 0 },
    { pollId: poll1._id, text: 'Java', voteCount: 0 },
    { pollId: poll1._id, text: 'C++', voteCount: 0 },
  ]);

  // Poll 2: Frontend framework (active)
  const poll2 = await Poll.create({
    title: 'Best frontend framework in 2024?',
    description: 'Choose the framework you enjoy working with most.',
    createdBy: userB._id,
    startTime: now,
    expiryTime: inSevenDays,
    status: 'active',
  });

  await Option.insertMany([
    { pollId: poll2._id, text: 'React', voteCount: 0 },
    { pollId: poll2._id, text: 'Vue.js', voteCount: 0 },
    { pollId: poll2._id, text: 'Angular', voteCount: 0 },
    { pollId: poll2._id, text: 'Svelte', voteCount: 0 },
  ]);

  // Poll 3: Database preference (expires in 1 day)
  const poll3 = await Poll.create({
    title: 'Which database do you prefer for new projects?',
    description: 'Select the database technology you prefer.',
    createdBy: userA._id,
    startTime: now,
    expiryTime: inOneDay,
    status: 'active',
  });

  await Option.insertMany([
    { pollId: poll3._id, text: 'MongoDB', voteCount: 0 },
    { pollId: poll3._id, text: 'PostgreSQL', voteCount: 0 },
    { pollId: poll3._id, text: 'MySQL', voteCount: 0 },
    { pollId: poll3._id, text: 'Redis', voteCount: 0 },
  ]);

  // Poll 4: Archived poll (already expired)
  const poll4 = await Poll.create({
    title: 'Best code editor for development?',
    description: 'Which editor do you use daily?',
    createdBy: userB._id,
    startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    expiryTime: expired,
    status: 'closed',
  });

  const editorOptions = await Option.insertMany([
    { pollId: poll4._id, text: 'VS Code', voteCount: 45 },
    { pollId: poll4._id, text: 'IntelliJ IDEA', voteCount: 20 },
    { pollId: poll4._id, text: 'Vim/Neovim', voteCount: 15 },
    { pollId: poll4._id, text: 'Sublime Text', voteCount: 10 },
  ]);

  console.log('✅ Polls created');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Accounts (Login with 7-digit ID or Email):');
  console.log('  ID: 24104110  | Email: alice@example.com | Password: password123');
  console.log('  ID: 24104111  | Email: bob@example.com   | Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Active Polls: 3');
  console.log('Archived Polls: 1 (Best code editor)');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
