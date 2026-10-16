const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const User = require('../models/User');

/**
 * Computes official poll results directly from the Vote collection via aggregation.
 * Eliminates count drift between Vote documents and Option cached numbers.
 */
const buildResults = async (pollId) => {
  const pId = new mongoose.Types.ObjectId(pollId);

  // 1. Fetch options defined for this poll
  const options = await Option.find({ pollId: pId }).lean();

  // 2. Aggregate actual votes cast per option from the Vote collection (source of truth)
  const voteAggs = await Vote.aggregate([
    { $match: { pollId: pId } },
    { $group: { _id: '$optionId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  let totalVotes = 0;
  voteAggs.forEach((row) => {
    countMap[row._id.toString()] = row.count;
    totalVotes += row.count;
  });

  // 3. Self-healing drift check: sync option.voteCount in the background if out of alignment
  options.forEach((opt) => {
    const accurateCount = countMap[opt._id.toString()] || 0;
    if (opt.voteCount !== accurateCount) {
      Option.findByIdAndUpdate(opt._id, { $set: { voteCount: accurateCount } }).exec();
    }
  });

  // 4. Build output with percentages
  const results = options.map((o) => {
    const voteCount = countMap[o._id.toString()] || 0;
    return {
      _id: o._id,
      text: o.text,
      voteCount,
      percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
    };
  });

  // Sort descending by vote count
  results.sort((a, b) => b.voteCount - a.voteCount);

  return {
    pollId: pollId.toString(),
    options: results,
    totalVotes,
    winner: totalVotes > 0 ? results[0] : null,
  };
};

const submitVote = async ({ pollId, optionId, userId, userRole }) => {
  if (!optionId) {
    const err = new Error('Please select an option.');
    err.statusCode = 400;
    throw err;
  }

  // Enforce admin voting restriction (Admins manage and govern, but do not vote)
  let role = userRole;
  if (!role && userId) {
    const voter = await User.findById(userId).select('role').lean();
    role = voter?.role;
  }
  if (role === 'admin') {
    const err = new Error('Administrators are not permitted to vote. Administrator accounts are restricted to poll management and moderation.');
    err.statusCode = 403;
    throw err;
  }

  // 1. Verify poll exists
  const poll = await Poll.findById(pollId);
  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check approval workflow state
  const isApprovedOrPublished =
    poll.approvalStatus === 'approved' || poll.approvalStatus === 'published';
  if (!isApprovedOrPublished) {
    const err = new Error('This poll is awaiting administrator approval and is not open for voting.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Check start and expiry date boundaries
  const now = new Date();
  if (poll.startTime && now < new Date(poll.startTime)) {
    const err = new Error(`This poll has not opened for voting yet. Voting opens on ${new Date(poll.startTime).toLocaleString()}.`);
    err.statusCode = 403;
    throw err;
  }

  if (poll.status === 'closed' || (poll.expiryTime && new Date(poll.expiryTime) <= now)) {
    if (poll.status === 'active') {
      poll.status = 'closed';
      await poll.save();
    }
    const err = new Error('This poll has expired or is closed. Voting is no longer allowed.');
    err.statusCode = 403;
    throw err;
  }

  // 4. Verify selected option exists and belongs to this poll
  const option = await Option.findOne({
    _id: optionId,
    pollId: poll._id,
  });

  if (!option) {
    const err = new Error('Invalid option. This option does not belong to the selected poll.');
    err.statusCode = 400;
    throw err;
  }

  // 5. Pre-check for duplicate vote (application layer)
  const existingVote = await Vote.findOne({ userId, pollId: poll._id });
  if (existingVote) {
    const err = new Error('You have already voted in this poll.');
    err.statusCode = 409;
    throw err;
  }

  // 6. Atomic vote creation with DB-level unique compound index { userId: 1, pollId: 1 }
  try {
    await Vote.create({ userId, pollId: poll._id, optionId });
  } catch (insertError) {
    if (insertError.code === 11000) {
      const err = new Error('You have already voted in this poll.');
      err.statusCode = 409;
      throw err;
    }
    throw insertError;
  }

  // 7. Atomically increment cached voteCount on Option
  await Option.findByIdAndUpdate(optionId, { $inc: { voteCount: 1 } });

  // 8. Recompute results from server aggregation (source of truth from Vote collection)
  const resultsData = await buildResults(poll._id);

  return resultsData;
};

const getParticipantVotes = async (pollId, user) => {
  const poll = await Poll.findById(pollId).populate('createdBy', 'name email').lean();
  if (!poll) {
    const err = new Error('Poll not found.');
    err.statusCode = 404;
    throw err;
  }

  const isAuthorized =
    user &&
    (user.role === 'admin' ||
      poll.createdBy._id.toString() === user._id.toString());

  if (!isAuthorized) {
    const err = new Error('Access denied. Only the poll creator or an administrator can view participant details.');
    err.statusCode = 403;
    throw err;
  }

  const votes = await Vote.find({ pollId })
    .populate('userId', 'name voterId email')
    .populate('optionId', 'text')
    .sort({ createdAt: -1 })
    .lean();

  return votes.map((v, index) => ({
    slNo: index + 1,
    _id: v._id,
    participantId: v.userId?.voterId || v.userId?.email || 'N/A',
    name: v.userId?.name || 'Anonymous',
    email: v.userId?.email || 'N/A',
    optionText: v.optionId?.text || 'Unknown',
    optionId: v.optionId?._id,
    votedAt: v.createdAt,
  }));
};

const checkUserVoteStatus = async (pollId, userId) => {
  const vote = await Vote.findOne({ userId, pollId }).populate('optionId', 'text').lean();
  return {
    hasVoted: Boolean(vote),
    vote: vote
      ? {
          optionId: vote.optionId?._id,
          optionText: vote.optionId?.text,
          votedAt: vote.createdAt,
        }
      : null,
  };
};

module.exports = {
  submitVote,
  buildResults,
  getParticipantVotes,
  checkUserVoteStatus,
};
