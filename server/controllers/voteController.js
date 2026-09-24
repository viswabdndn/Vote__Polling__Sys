const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const { emitVoteUpdate } = require('../socket/socket');

// @desc    Cast a vote
// @route   POST /api/polls/:pollId/vote
// @access  Private
const castVote = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id; // Always from JWT, never from body

    if (!optionId) {
      res.status(400);
      throw new Error('Please select an option.');
    }

    // 1. Verify poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    // 2. Check if poll is expired or closed
    const now = new Date();
    if (poll.status === 'closed' || poll.expiryTime <= now) {
      res.status(403);
      throw new Error('This poll has expired or is closed. Voting is no longer allowed.');
    }

    // 3. Verify option exists AND belongs to this poll
    const option = await Option.findOne({
      _id: optionId,
      pollId: pollId,
    });

    if (!option) {
      res.status(400);
      throw new Error('Invalid option. This option does not belong to the selected poll.');
    }

    // 4. Check for existing vote (application-level check before DB write)
    const existingVote = await Vote.findOne({ userId, pollId });
    if (existingVote) {
      res.status(409);
      throw new Error('You have already voted in this poll.');
    }

    // 5. Save vote — MongoDB compound unique index { userId: 1, pollId: 1 } guarantees uniqueness
    await Vote.create({ userId, pollId, optionId });

    // 6. Atomically increment voteCount on the selected option
    await Option.findByIdAndUpdate(
      optionId,
      { $inc: { voteCount: 1 } },
      { new: true }
    );

    // 7. Build and broadcast updated results via Socket.IO
    const resultsData = await buildResults(pollId);
    emitVoteUpdate(pollId, resultsData);

    res.status(201).json({
      success: true,
      message: 'Vote submitted successfully.',
      results: resultsData,
    });
  } catch (error) {
    // MongoDB duplicate key error from unique index
    if (error.code === 11000) {
      res.status(409);
      error.message = 'You have already voted in this poll.';
    }

    next(error);
  }
};

// @desc    Get results for a poll
// @route   GET /api/polls/:pollId/results
// @access  Private
const getResults = async (req, res, next) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId).populate('createdBy', 'name');
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const resultsData = await buildResults(pollId);

    res.json({
      success: true,
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        status: poll.status,
        expiryTime: poll.expiryTime,
        createdBy: poll.createdBy,
        effectiveStatus: poll.effectiveStatus,
      },
      ...resultsData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if logged-in user has voted in a poll
// @route   GET /api/polls/:pollId/vote-status
// @access  Private
const getVoteStatus = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const vote = await Vote.findOne({ userId, pollId }).populate('optionId');

    res.json({
      success: true,
      hasVoted: !!vote,
      vote: vote
        ? {
            optionId: vote.optionId?._id,
            optionText: vote.optionId?.text,
            votedAt: vote.createdAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: build full results object for a poll
async function buildResults(pollId) {
  const options = await Option.find({ pollId });
  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  const results = options.map((o) => ({
    _id: o._id,
    text: o.text,
    voteCount: o.voteCount,
    percentage:
      totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0,
  }));

  // Sort by vote count descending
  results.sort((a, b) => b.voteCount - a.voteCount);

  return {
    pollId,
    options: results,
    totalVotes,
    winner: totalVotes > 0 ? results[0] : null,
  };
}

module.exports = { castVote, getResults, getVoteStatus };
