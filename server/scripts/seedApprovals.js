require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🔄 Connected to MongoDB. Running approval migration & seed...');

  // 1. Find Admin and Creator
  const admin = await User.findOne({ role: 'admin' });
  const creator = await User.findOne({ email: 'john@example.com' });

  if (!creator) {
    console.error('❌ Creator user (john@example.com) not found!');
    process.exit(1);
  }

  // 2. Ensure existing polls are marked as 'approved'
  const legacyPolls = await Poll.find({
    $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: null }, { approvalStatus: 'active' }],
  });

  for (const poll of legacyPolls) {
    poll.approvalStatus = 'approved';
    if (admin) poll.approvedBy = admin._id;
    poll.approvedAt = poll.createdAt || new Date();
    await poll.save();
    console.log(`  ✅ Updated legacy poll to approved: "${poll.title}"`);
  }

  // 3. Remove any previous test pending polls to avoid duplicates
  await Poll.deleteMany({
    title: {
      $in: [
        'Annual Tech Symposium 2024: Keynote Topic Selection',
        'Campus Sports Fest: Vote for New Tournament Addition',
        'Proposed Library Extended Working Hours during Finals',
      ],
    },
  });

  // 4. Create sample pending approval polls
  const samplePendingPolls = [
    {
      title: 'Annual Tech Symposium 2024: Keynote Topic Selection',
      description:
        'Help the department select the core keynote topic for the upcoming National Tech Symposium. Submitted by creator for administrative review.',
      createdBy: creator._id,
      expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active',
      approvalStatus: 'pending',
      options: [
        'Generative AI & Autonomous Agent Systems',
        'Zero-Trust Cloud & Cybersecurity Architectures',
        'Quantum Computing & Post-Quantum Cryptography',
        'Sustainable Green Computing & IoT Hardware',
      ],
    },
    {
      title: 'Campus Sports Fest: Vote for New Tournament Addition',
      description:
        'We have budget to introduce one new major competitive event in the annual sports tournament.',
      createdBy: creator._id,
      expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'active',
      approvalStatus: 'pending',
      options: [
        'Badminton Doubles Championship',
        'Table Tennis Rapid Open',
        'Inter-College Chess Masterclass',
        'Esports Arena (Valorant & FIFA 24)',
      ],
    },
    {
      title: 'Proposed Library Extended Working Hours during Finals',
      description:
        'Student council request to adjust central library opening hours during exam preparation weeks.',
      createdBy: creator._id,
      expiryTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'active',
      approvalStatus: 'pending',
      options: [
        '24/7 round-the-clock during study preparation',
        'Open until 2:00 AM every night',
        'Keep standard closing time (10:00 PM)',
      ],
    },
  ];

  for (const item of samplePendingPolls) {
    const { options, ...pollData } = item;
    const newPoll = await Poll.create(pollData);

    const optionDocs = options.map((optText) => ({
      pollId: newPoll._id,
      text: optText,
      voteCount: 0,
    }));
    await Option.insertMany(optionDocs);

    console.log(`  ⏳ Created Pending Poll for Admin Review: "${newPoll.title}" with ${options.length} options.`);
  }

  const pendingCount = await Poll.countDocuments({ approvalStatus: 'pending' });
  const approvedCount = await Poll.countDocuments({ approvalStatus: 'approved' });
  console.log(`\n🎉 Seed Complete!`);
  console.log(`   Pending Polls: ${pendingCount}`);
  console.log(`   Approved Polls: ${approvedCount}`);

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
