const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');
const { autoCloseExpiredPolls } = require('./pollExpiryService');

/**
 * Helper to attach options and optional vote counts to poll objects
 */
const attachOptions = async (polls, includeVotes = false) => {
  if (!Array.isArray(polls) || polls.length === 0) return [];

  const pollIds = polls.map((p) => p._id);
  const options = await Option.find({ pollId: { $in: pollIds } }).lean();

  let voteCounts = {};
  if (includeVotes) {
    const voteDocs = await Vote.aggregate([
      { $match: { pollId: { $in: pollIds } } },
      { $group: { _id: '$pollId', count: { $sum: 1 } } },
    ]);
    voteDocs.forEach((v) => {
      voteCounts[v._id.toString()] = v.count;
    });
  }

  return polls.map((poll) => {
    const pollObj = typeof poll.toJSON === 'function' ? poll.toJSON() : { ...poll };
    pollObj.options = options.filter(
      (o) => o.pollId.toString() === poll._id.toString()
    );
    if (includeVotes) {
      pollObj.totalVotes = voteCounts[poll._id.toString()] || 0;
    }
    return pollObj;
  });
};

const createPoll = async ({ user, title, description, options, startTime, expiryTime }) => {
  // Ensure participants cannot create polls
  if (user.role === 'participant') {
    const err = new Error('Participants are only allowed to answer/vote in polls. Only poll creators can create polls.');
    err.statusCode = 403;
    throw err;
  }

  // Check creator permissions
  if (user.role === 'creator' && user.creatorPermissions?.canCreatePoll === false) {
    const err = new Error('Permission denied: Permission to create polls has been revoked by an administrator.');
    err.statusCode = 403;
    throw err;
  }

  // Validate fields
  if (!title || !expiryTime || !options) {
    const err = new Error('Title, expiry time, and options are required.');
    err.statusCode = 400;
    throw err;
  }

  if (title.trim().length < 5 || title.trim().length > 200) {
    const err = new Error('Poll title must be between 5 and 200 characters.');
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(options) || options.length < 2) {
    const err = new Error('At least two voting options are required.');
    err.statusCode = 400;
    throw err;
  }

  if (options.length > 10) {
    const err = new Error('A poll cannot exceed 10 voting options.');
    err.statusCode = 400;
    throw err;
  }

  const cleanOptions = options.map((o) =>
    typeof o === 'string' ? o.trim() : (o.text || '').trim()
  );

  if (cleanOptions.some((o) => !o)) {
    const err = new Error('Option text cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (cleanOptions.some((o) => o.length > 200)) {
    const err = new Error('Option text cannot exceed 200 characters.');
    err.statusCode = 400;
    throw err;
  }

  const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
  if (uniqueOptions.size !== cleanOptions.length) {
    const err = new Error('Duplicate option names are not allowed.');
    err.statusCode = 400;
    throw err;
  }

  const expiry = new Date(expiryTime);
  if (isNaN(expiry.getTime())) {
    const err = new Error('Invalid expiry date/time.');
    err.statusCode = 400;
    throw err;
  }
  if (expiry <= new Date()) {
    const err = new Error('Expiry date/time must be in the future.');
    err.statusCode = 400;
    throw err;
  }

  const start = startTime ? new Date(startTime) : new Date();
  if (isNaN(start.getTime())) {
    const err = new Error('Invalid start date/time.');
    err.statusCode = 400;
    throw err;
  }
  if (start >= expiry) {
    const err = new Error('Start time cannot be after expiry time.');
    err.statusCode = 400;
    throw err;
  }

  const isAdmin = user.role === 'admin';
  const approvalStatus = isAdmin ? 'approved' : 'pending';
  const approvedBy = isAdmin ? user._id : undefined;
  const approvedAt = isAdmin ? new Date() : undefined;

  const poll = await Poll.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    createdBy: user._id,
    startTime: start,
    expiryTime: expiry,
    status: 'active',
    approvalStatus,
    approvedBy,
    approvedAt,
  });

  const optionDocs = await Option.insertMany(
    cleanOptions.map((text) => ({ pollId: poll._id, text }))
  );

  const message = isAdmin
    ? 'Poll created and published successfully.'
    : 'Poll submitted successfully. It has been sent to the administrator for review and approval.';

  return {
    message,
    poll: {
      ...poll.toJSON(),
      options: optionDocs,
    },
  };
};

const getAllPolls = async ({ user, page, limit }) => {
  await autoCloseExpiredPolls();

  const filter =
    user.role === 'admin'
      ? {}
      : {
          $or: [
            { approvalStatus: { $in: ['approved', 'published'] } },
            { createdBy: user._id },
          ],
        };

  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  let query = Poll.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [polls, totalCount] = await Promise.all([
    query.exec(),
    Poll.countDocuments(filter),
  ]);

  const pollsWithOptions = await attachOptions(polls, true);

  if (hasPagination) {
    return {
      polls: pollsWithOptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { polls: pollsWithOptions };
};

const getActivePolls = async ({ page, limit }) => {
  await autoCloseExpiredPolls();
  const now = new Date();

  const filter = {
    approvalStatus: { $in: ['approved', 'published'] },
    status: 'active',
    expiryTime: { $gt: now },
  };

  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  let query = Poll.find(filter)
    .populate('createdBy', 'name email')
    .sort({ expiryTime: 1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [polls, totalCount] = await Promise.all([
    query.exec(),
    Poll.countDocuments(filter),
  ]);

  const pollsWithOptions = await attachOptions(polls);

  if (hasPagination) {
    return {
      polls: pollsWithOptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { polls: pollsWithOptions };
};

const getArchivedPolls = async ({ page, limit }) => {
  await autoCloseExpiredPolls();
  const now = new Date();

  const filter = {
    approvalStatus: { $in: ['approved', 'published'] },
    $or: [{ status: 'closed' }, { expiryTime: { $lte: now } }],
  };

  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  let query = Poll.find(filter)
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [polls, totalCount] = await Promise.all([
    query.exec(),
    Poll.countDocuments(filter),
  ]);

  const pollsWithOptions = await attachOptions(polls, true);

  if (hasPagination) {
    return {
      polls: pollsWithOptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { polls: pollsWithOptions };
};

const getMyPolls = async ({ user, page, limit }) => {
  await autoCloseExpiredPolls();

  const filter = { createdBy: user._id };

  const hasPagination = page !== undefined;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  let query = Poll.find(filter)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (hasPagination) {
    query = query.skip(skip).limit(limitNum);
  }

  const [polls, totalCount] = await Promise.all([
    query.exec(),
    Poll.countDocuments(filter),
  ]);

  const pollsWithOptions = await attachOptions(polls, true);

  if (hasPagination) {
    return {
      polls: pollsWithOptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    };
  }

  return { polls: pollsWithOptions };
};

const getPollById = async ({ pollId, user }) => {
  await autoCloseExpiredPolls();

  const poll = await Poll.findById(pollId)
    .populate('createdBy', 'name email voterId')
    .populate('approvedBy', 'name email')
    .lean();

  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner =
    user &&
    poll.createdBy &&
    poll.createdBy._id.toString() === user._id.toString();
  const isAdmin = user && user.role === 'admin';
  const isApprovedOrPublished =
    poll.approvalStatus === 'approved' || poll.approvalStatus === 'published';

  if (!isApprovedOrPublished && !isOwner && !isAdmin) {
    const err = new Error('Access denied. This poll is pending administrator approval.');
    err.statusCode = 403;
    throw err;
  }

  const options = await Option.find({ pollId: poll._id }).lean();
  const totalVotes = await Vote.countDocuments({ pollId: poll._id });

  return {
    ...poll,
    options,
    totalVotes,
  };
};

const updatePoll = async ({ pollId, user, title, description, expiryTime, status }) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = poll.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isOwner) {
    const err = new Error('Forbidden: You can only edit polls you created.');
    err.statusCode = 403;
    throw err;
  }

  if (!isAdmin && user.creatorPermissions?.canEditPoll === false) {
    const err = new Error('Permission denied: Permission to edit polls has been revoked by an administrator.');
    err.statusCode = 403;
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
    if (isNaN(exp.getTime())) {
      const err = new Error('Invalid expiry date/time.');
      err.statusCode = 400;
      throw err;
    }
    poll.expiryTime = exp;
  }
  if (status && ['active', 'closed', 'draft'].includes(status)) {
    if (!isAdmin && user.creatorPermissions?.canPublishPoll === false) {
      const err = new Error('Permission denied: Permission to publish or change poll status has been revoked.');
      err.statusCode = 403;
      throw err;
    }
    poll.status = status;
  }

  await poll.save();

  const options = await Option.find({ pollId: poll._id }).lean();

  return {
    poll: {
      ...poll.toJSON(),
      options,
    },
  };
};

const closePoll = async ({ pollId, user }) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = poll.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isOwner) {
    const err = new Error('Forbidden: You are not authorized to close this poll.');
    err.statusCode = 403;
    throw err;
  }

  if (!isAdmin && user.creatorPermissions?.canPublishPoll === false) {
    const err = new Error('Permission denied: Permission to publish or close polls has been revoked by an administrator.');
    err.statusCode = 403;
    throw err;
  }

  if (poll.status === 'closed') {
    const err = new Error('Poll is already closed.');
    err.statusCode = 400;
    throw err;
  }

  poll.status = 'closed';
  await poll.save();

  return poll;
};

const togglePollStatus = async ({ pollId, user }) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = poll.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isOwner) {
    const err = new Error('Forbidden: You are not authorized to manage this poll.');
    err.statusCode = 403;
    throw err;
  }

  if (!isAdmin && user.creatorPermissions?.canPublishPoll === false) {
    const err = new Error('Permission denied: Permission to publish or change poll status has been revoked by an administrator.');
    err.statusCode = 403;
    throw err;
  }

  poll.status = poll.status === 'active' ? 'closed' : 'active';
  await poll.save();

  return poll;
};

const deletePoll = async ({ pollId, user }) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = poll.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isOwner) {
    const err = new Error('Forbidden: You can only delete polls you created.');
    err.statusCode = 403;
    throw err;
  }

  if (!isAdmin && user.creatorPermissions?.canDeletePoll === false) {
    const err = new Error('Permission denied: Permission to delete polls has been revoked by an administrator.');
    err.statusCode = 403;
    throw err;
  }

  await Vote.deleteMany({ pollId: poll._id });
  await Option.deleteMany({ pollId: poll._id });
  await Poll.findByIdAndDelete(poll._id);

  return true;
};

module.exports = {
  attachOptions,
  createPoll,
  getAllPolls,
  getActivePolls,
  getArchivedPolls,
  getMyPolls,
  getPollById,
  updatePoll,
  closePoll,
  togglePollStatus,
  deletePoll,
};
