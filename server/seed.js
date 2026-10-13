require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Poll = require('./models/Poll');
const Option = require('./models/Option');
const Vote = require('./models/Vote');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  const isClean = process.argv.includes('--clean') || process.argv.includes('--force');

  console.log('🌱 Starting seed...');

  if (isClean) {
    console.log('⚠️  --clean flag detected: clearing existing data...');
    await Vote.deleteMany({});
    await Option.deleteMany({});
    await Poll.deleteMany({});
    await User.deleteMany({});
  }

  // 0. System Administrator (Admin)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@polllive.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      voterId: process.env.ADMIN_VOTER_ID || 'admin01',
      email: adminEmail,
      role: 'admin',
      password: adminPassword,
      isActive: true,
      creatorPermissions: {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      },
    });
    console.log('✅ Created default Admin:', adminEmail);
  } else {
    console.log('ℹ️  Admin already exists (preserved):', adminEmail);
  }

  // 1. Creator (John Smith) - only create if not already existing
  let userA = await User.findOne({ email: 'john@example.com' });
  if (!userA) {
    userA = await User.create({
      name: 'John Smith',
      voterId: 'johnsmith',
      email: 'john@example.com',
      role: 'creator', // Poll Creator
      password: 'password123',
      isActive: true,
      creatorPermissions: {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      },
    });
    console.log('✅ Created default Creator: John Smith');
  } else {
    console.log('ℹ️  Creator John Smith already exists (preserved)');
  }

  // 2. Participant / Student (Bob Smith) - only create if not already existing
  let userB = await User.findOne({
    $or: [{ email: '24104111@nec.edu.in' }, { voterId: '24104111' }],
  });
  if (!userB) {
    userB = await User.create({
      name: 'Bob Smith',
      voterId: '24104111',
      email: '24104111@nec.edu.in',
      role: 'participant', // Participant / Voter
      password: 'password123',
    });
    console.log('✅ Created default Participant: Bob Smith');
  } else {
    console.log('ℹ️  Participant Bob Smith already exists (preserved)');
  }

  const existingUsersCount = await User.countDocuments();
  console.log(`👥 Total users currently in database: ${existingUsersCount}`);

  const existingPollsCount = await Poll.countDocuments();
  if (existingPollsCount > 0 && !isClean) {
    console.log(`📊 Existing polls preserved (${existingPollsCount} polls in DB).`);
    console.log('\n🎉 Seed finished safely without overwriting your data!');
    process.exit(0);
  }

  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expired = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  // Poll 1: Programming language (active - created by John Smith)
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

  // Poll 2: Frontend framework (active - created by John Smith)
  const poll2 = await Poll.create({
    title: 'Best frontend framework in 2024?',
    description: 'Choose the framework you enjoy working with most.',
    createdBy: userA._id,
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

  // Poll 3: Database preference (active - created by John Smith)
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

  // Poll 4: Archived poll (closed - created by John Smith)
  const poll4 = await Poll.create({
    title: 'Best code editor for development?',
    description: 'Which editor do you use daily?',
    createdBy: userA._id,
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

  // Sample vote for Bob in archived poll
  await Vote.create({
    userId: userB._id,
    pollId: poll4._id,
    optionId: editorOptions[0]._id,
  });

  console.log('✅ Polls created');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('0. 🛡️  ADMIN (Full System & RBAC Control):');
  console.log(`   Name: System Administrator`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. 👑 CREATOR (Creates and manages their own polls):');
  console.log('   Name: John Smith');
  console.log('   Email/ID: john@example.com (or "johnsmith")');
  console.log('   Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. 🎓 PARTICIPANT (Voter / Answers Polls via Link):');
  console.log('   Name: Bob Smith');
  console.log('   ID: 24104111 (or "24104111@nec.edu.in")');
  console.log('   Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Active Polls: 3 (All created by John Smith)');
  console.log('Archived Polls: 1');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
