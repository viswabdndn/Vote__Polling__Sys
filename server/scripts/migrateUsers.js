require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const migrate = async () => {
  await connectDB();
  console.log('🔄 Running User RBAC Migration...');

  const users = await User.find({});
  let updatedCount = 0;

  for (const user of users) {
    let modified = false;

    if (typeof user.isActive !== 'boolean') {
      user.isActive = true;
      modified = true;
    }

    if (!user.creatorPermissions) {
      user.creatorPermissions = {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      };
      modified = true;
    } else {
      const keys = ['canCreatePoll', 'canEditPoll', 'canPublishPoll', 'canDeletePoll'];
      keys.forEach((k) => {
        if (typeof user.creatorPermissions[k] !== 'boolean') {
          user.creatorPermissions[k] = true;
          modified = true;
        }
      });
    }

    if (modified) {
      await user.save();
      updatedCount++;
      console.log(`  Updated user: ${user.name} (${user.email}, ${user.role})`);
    }
  }

  console.log(`✅ Migration complete. ${updatedCount} users updated to schema with RBAC defaults.`);
  process.exit(0);
};

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
