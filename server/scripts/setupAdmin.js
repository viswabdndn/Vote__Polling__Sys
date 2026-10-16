require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Parse command line arguments (e.g., node scripts/setupAdmin.js --email admin@domain.com --password SecretPass --name "Admin")
const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
};

const setupAdmin = async () => {
  const args = parseArgs();

  // In production, reject default credentials
  if (process.env.NODE_ENV === 'production') {
    if (!args.password && !process.env.ADMIN_PASSWORD) {
      console.error('❌ Error: In production, ADMIN_PASSWORD environment variable or --password argument is mandatory. Refusing to use fallback default passwords.');
      process.exit(1);
    }
    if (!args.email && !process.env.ADMIN_EMAIL) {
      console.error('❌ Error: In production, ADMIN_EMAIL environment variable or --email argument is mandatory. Refusing to use fallback default email.');
      process.exit(1);
    }
  }

  const email = (args.email || process.env.ADMIN_EMAIL || 'admin@polllive.local').trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const name = (args.name || process.env.ADMIN_NAME || 'System Administrator').trim();
  const voterId = (args.voterId || process.env.ADMIN_VOTER_ID || 'admin01').trim();
  const force = Boolean(args.force || args.reset);

  if (!email || !password) {
    console.error('❌ Error: Both email and password are required to configure an admin account.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();

  console.log('🔐 Configuring initial Admin account...');

  let admin = await User.findOne({ email }).select('+password');

  if (admin) {
    let modified = false;
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      modified = true;
      console.log(`ℹ️  Promoted existing account '${email}' to 'admin' role.`);
    }

    if (!admin.isActive) {
      admin.isActive = true;
      modified = true;
      console.log(`ℹ️  Re-activated account '${email}'.`);
    }

    if (force) {
      admin.password = password; // Trigger pre-save hashing
      modified = true;
      console.log(`ℹ️  Updated password for admin '${email}'.`);
    }

    if (modified) {
      await admin.save();
    }
    console.log(`✅ Admin account is ready: ${email}`);
  } else {
    // Create new admin user
    admin = await User.create({
      name,
      email,
      voterId,
      password,
      role: 'admin',
      isActive: true,
      creatorPermissions: {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      },
    });

    console.log(`🎉 Created new Admin account successfully!`);
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID:    ${admin.voterId}`);
    console.log(`   Role:  ${admin.role}`);
  }

  console.log('\n🔒 Admin setup complete.');
  process.exit(0);
};

setupAdmin().catch((err) => {
  console.error('❌ Admin setup error:', err);
  process.exit(1);
});
