const Poll = require('../models/Poll');

/**
 * Checks all active polls and transitions any whose expiryTime has passed to 'closed'.
 */
const autoCloseExpiredPolls = async () => {
  try {
    const now = new Date();
    const result = await Poll.updateMany(
      {
        status: 'active',
        expiryTime: { $lte: now },
      },
      {
        $set: { status: 'closed' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[autoCloseExpiredPolls] Closed ${result.modifiedCount} expired poll(s).`);
    }

    return result.modifiedCount || 0;
  } catch (error) {
    console.error('[autoCloseExpiredPolls] Error closing expired polls:', error.message);
    return 0;
  }
};

/**
 * Schedules periodic execution of the expiration job.
 */
let expiryIntervalId = null;

const startExpiryJob = (intervalMs = 60000) => {
  if (expiryIntervalId) return; // Prevent multiple interval timers
  autoCloseExpiredPolls(); // Immediate check on boot
  expiryIntervalId = setInterval(autoCloseExpiredPolls, intervalMs);
};

const stopExpiryJob = () => {
  if (expiryIntervalId) {
    clearInterval(expiryIntervalId);
    expiryIntervalId = null;
  }
};

module.exports = {
  autoCloseExpiredPolls,
  startExpiryJob,
  stopExpiryJob,
};
