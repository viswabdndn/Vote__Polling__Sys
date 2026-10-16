const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

const getAdminStats = async () => {
  const now = new Date();
  const [
    totalUsers,
    totalCreators,
    totalParticipants,
    totalAdmins,
    totalPolls,
    activePolls,
    closedPolls,
    pendingApprovals,
    totalVotes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'creator' }),
    User.countDocuments({ role: 'participant' }),
    User.countDocuments({ role: 'admin' }),
    Poll.countDocuments(),
    Poll.countDocuments({ approvalStatus: 'approved', status: 'active', expiryTime: { $gt: now } }),
    Poll.countDocuments({ approvalStatus: 'approved', $or: [{ status: 'closed' }, { expiryTime: { $lte: now } }] }),
    Poll.countDocuments({ approvalStatus: 'pending' }),
    Vote.countDocuments(),
  ]);

  return {
    totalUsers,
    totalCreators,
    totalParticipants,
    totalAdmins,
    totalPolls,
    activePolls,
    closedPolls,
    pendingApprovals,
    totalVotes,
  };
};

const getCreators = async () => {
  const creators = await User.find({ role: 'creator' })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  const creatorIds = creators.map((c) => c._id);

  const pollStats = await Poll.aggregate([
    { $match: { createdBy: { $in: creatorIds } } },
    {
      $group: {
        _id: '$createdBy',
        totalPolls: { $sum: 1 },
        activePolls: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gt: ['$expiryTime', new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const statsMap = {};
  pollStats.forEach((stat) => {
    statsMap[stat._id.toString()] = stat;
  });

  return creators.map((creator) => {
    const stats = statsMap[creator._id.toString()] || {
      totalPolls: 0,
      activePolls: 0,
    };
    return {
      ...creator,
      stats,
    };
  });
};

const updateCreatorStatus = async ({ creatorId, currentUserId, isActive }) => {
  const user = await User.findById(creatorId);

  if (!user) {
    const err = new Error('Creator not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === currentUserId.toString()) {
    const err = new Error('You cannot deactivate your own administrative account.');
    err.statusCode = 400;
    throw err;
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    creatorPermissions: user.creatorPermissions,
  };
};

const updateCreatorPermissions = async ({ creatorId, permissions }) => {
  const user = await User.findById(creatorId);

  if (!user) {
    const err = new Error('Creator not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'creator') {
    const err = new Error('Permissions can only be managed for Creator accounts.');
    err.statusCode = 400;
    throw err;
  }

  const { canCreatePoll, canEditPoll, canPublishPoll, canDeletePoll } = permissions;

  user.creatorPermissions = {
    canCreatePoll: typeof canCreatePoll === 'boolean' ? canCreatePoll : user.creatorPermissions?.canCreatePoll ?? true,
    canEditPoll: typeof canEditPoll === 'boolean' ? canEditPoll : user.creatorPermissions?.canEditPoll ?? true,
    canPublishPoll: typeof canPublishPoll === 'boolean' ? canPublishPoll : user.creatorPermissions?.canPublishPoll ?? true,
    canDeletePoll: typeof canDeletePoll === 'boolean' ? canDeletePoll : user.creatorPermissions?.canDeletePoll ?? true,
  };

  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    creatorPermissions: user.creatorPermissions,
  };
};

const deleteCreator = async ({ creatorId, currentUserId }) => {
  const user = await User.findById(creatorId);

  if (!user) {
    const err = new Error('Creator not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === currentUserId.toString()) {
    const err = new Error('You cannot delete your own account.');
    err.statusCode = 400;
    throw err;
  }

  const creatorPolls = await Poll.find({ createdBy: user._id });
  const pollIds = creatorPolls.map((p) => p._id);

  if (pollIds.length > 0) {
    await Vote.deleteMany({ pollId: { $in: pollIds } });
    await Option.deleteMany({ pollId: { $in: pollIds } });
    await Poll.deleteMany({ _id: { $in: pollIds } });
  }

  await Vote.deleteMany({ userId: user._id });
  await User.findByIdAndDelete(user._id);

  return {
    deletedPollCount: pollIds.length,
    userName: user.name,
  };
};

const getAllUsers = async ({ role, status, q, page, limit }) => {
  const filter = {};

  if (role && role !== 'all') {
    filter.role = role;
  }

  if (status && status !== 'all') {
    filter.isActive = status === 'active';
  }

  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { voterId: searchRegex },
    ];
  }

  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  let query = User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [users, totalCount] = await Promise.all([
    query.exec(),
    User.countDocuments(filter),
  ]);

  if (hasPagination) {
    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { users };
};

const updateUserStatus = async ({ userId, currentUserId, isActive }) => {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === currentUserId.toString()) {
    const err = new Error('You cannot deactivate your own account.');
    err.statusCode = 400;
    throw err;
  }

  // Last active admin protection
  if (user.role === 'admin' && !isActive) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) {
      const err = new Error('Cannot deactivate the last remaining active administrator account.');
      err.statusCode = 400;
      throw err;
    }
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

const updateUserRole = async ({ userId, currentUserId, role }) => {
  if (!['admin', 'creator', 'participant'].includes(role)) {
    const err = new Error("Invalid role specified. Must be 'admin', 'creator', or 'participant'.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === currentUserId.toString() && role !== 'admin') {
    const err = new Error('You cannot demote yourself from the Admin role.');
    err.statusCode = 400;
    throw err;
  }

  // Last admin demotion protection
  if (user.role === 'admin' && role !== 'admin') {
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    if (totalAdmins <= 1) {
      const err = new Error('Cannot demote the last remaining administrator account.');
      err.statusCode = 400;
      throw err;
    }
  }

  user.role = role;

  if (role === 'creator' && !user.creatorPermissions) {
    user.creatorPermissions = {
      canCreatePoll: true,
      canEditPoll: true,
      canPublishPoll: true,
      canDeletePoll: true,
    };
  }

  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    creatorPermissions: user.creatorPermissions,
  };
};

const deleteUser = async ({ userId, currentUserId }) => {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user._id.toString() === currentUserId.toString()) {
    const err = new Error('You cannot delete your own administrative account.');
    err.statusCode = 400;
    throw err;
  }

  // Last admin deletion protection
  if (user.role === 'admin') {
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    if (totalAdmins <= 1) {
      const err = new Error('Cannot delete the last remaining administrator account.');
      err.statusCode = 400;
      throw err;
    }
  }

  const creatorPolls = await Poll.find({ createdBy: user._id });
  const pollIds = creatorPolls.map((p) => p._id);
  if (pollIds.length > 0) {
    await Vote.deleteMany({ pollId: { $in: pollIds } });
    await Option.deleteMany({ pollId: { $in: pollIds } });
    await Poll.deleteMany({ _id: { $in: pollIds } });
  }

  await Vote.deleteMany({ userId: user._id });
  await User.findByIdAndDelete(user._id);

  return user.name;
};

const getAdminPolls = async ({ page, limit }) => {
  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 15));
  const skip = (pageNum - 1) * limitNum;

  let query = Poll.find()
    .populate('createdBy', 'name email voterId')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [polls, totalCount] = await Promise.all([
    query.exec(),
    Poll.countDocuments(),
  ]);

  const pollIds = polls.map((p) => p._id);
  const options = await Option.find({ pollId: { $in: pollIds } }).lean();

  const voteDocs = await Vote.aggregate([
    { $match: { pollId: { $in: pollIds } } },
    { $group: { _id: '$pollId', count: { $sum: 1 } } },
  ]);

  const voteCounts = {};
  voteDocs.forEach((v) => {
    voteCounts[v._id.toString()] = v.count;
  });

  const enrichedPolls = polls.map((poll) => {
    const pollObj = { ...poll };
    pollObj.options = options.filter(
      (o) => o.pollId.toString() === poll._id.toString()
    );
    pollObj.totalVotes = voteCounts[poll._id.toString()] || 0;
    return pollObj;
  });

  if (hasPagination) {
    return {
      polls: enrichedPolls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { polls: enrichedPolls };
};

const getPendingPolls = async () => {
  const polls = await Poll.find({ approvalStatus: 'pending' })
    .populate('createdBy', 'name email voterId')
    .sort({ createdAt: -1 })
    .lean();

  const pollIds = polls.map((p) => p._id);
  const options = await Option.find({ pollId: { $in: pollIds } }).lean();

  return polls.map((p) => {
    const obj = { ...p };
    obj.options = options.filter(
      (o) => o.pollId.toString() === p._id.toString()
    );
    return obj;
  });
};

const approvePoll = async ({ pollId, adminId, title, description, expiryTime, options }) => {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  if (title && title.trim().length >= 5) {
    poll.title = title.trim();
  }
  if (typeof description === 'string') {
    poll.description = description.trim();
  }
  if (expiryTime) {
    const exp = new Date(expiryTime);
    if (!isNaN(exp.getTime()) && exp > new Date()) {
      poll.expiryTime = exp;
    }
  }

  if (Array.isArray(options) && options.length >= 2) {
    const cleanOptions = options
      .map((o) => (typeof o === 'string' ? o.trim() : (o.text || '').trim()))
      .filter(Boolean);

    if (cleanOptions.length >= 2) {
      await Option.deleteMany({ pollId: poll._id });
      await Option.insertMany(
        cleanOptions.map((text) => ({ pollId: poll._id, text }))
      );
    }
  }

  poll.approvalStatus = 'approved';
  poll.approvedBy = adminId;
  poll.approvedAt = new Date();
  poll.status = 'active';
  poll.rejectionReason = '';

  await poll.save();

  const updatedOptions = await Option.find({ pollId: poll._id });

  return {
    poll: {
      ...poll.toJSON(),
      options: updatedOptions,
    },
  };
};

const rejectPoll = async ({ pollId, reason }) => {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  poll.approvalStatus = 'rejected';
  poll.rejectionReason = (reason || 'Does not meet polling criteria.').trim();
  await poll.save();

  return poll;
};

const createCreator = async ({ name, email, password, voterId, permissions = {} }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    const err = new Error('An account with this email address already exists.');
    err.statusCode = 409;
    throw err;
  }

  if (voterId && voterId.trim()) {
    const existingVoterId = await User.findOne({ voterId: voterId.trim() });
    if (existingVoterId) {
      const err = new Error('An account with this Participant/Staff ID already exists.');
      err.statusCode = 409;
      throw err;
    }
  }

  const creatorPermissions = {
    canCreatePoll: permissions.canCreatePoll !== false,
    canEditPoll: permissions.canEditPoll !== false,
    canPublishPoll: permissions.canPublishPoll !== false,
    canDeletePoll: permissions.canDeletePoll !== false,
  };

  const creator = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password, // Automatically hashed by User pre-save bcrypt hook
    voterId: voterId && voterId.trim() ? voterId.trim() : undefined,
    role: 'creator',
    isActive: true,
    creatorPermissions,
  });

  return {
    _id: creator._id,
    name: creator.name,
    email: creator.email,
    voterId: creator.voterId,
    role: creator.role,
    isActive: creator.isActive,
    creatorPermissions: creator.creatorPermissions,
    createdAt: creator.createdAt,
    stats: { totalPolls: 0, activePolls: 0 },
  };
};

module.exports = {
  getAdminStats,
  getCreators,
  createCreator,
  updateCreatorStatus,
  updateCreatorPermissions,
  deleteCreator,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAdminPolls,
  getPendingPolls,
  approvePoll,
  rejectPoll,
};
