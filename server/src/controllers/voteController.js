const voteService = require('../services/voteService');
const { emitVoteUpdate } = require('../sockets/socket');
const Poll = require('../models/Poll');

// @desc    Cast a vote
// @route   POST /api/polls/:pollId/vote
// @access  Private
const castVote = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id;

    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators are not permitted to vote. Administrator accounts are restricted to poll management and moderation.',
        code: 'ADMIN_VOTING_RESTRICTED',
      });
    }

    const resultsData = await voteService.submitVote({
      pollId,
      optionId,
      userId,
      userRole: req.user.role,
    });

    // Broadcast live update to all subscribed socket viewers
    emitVoteUpdate(pollId.toString(), resultsData);

    res.status(201).json({
      success: true,
      message: 'Vote submitted successfully.',
      results: resultsData,
    });
  } catch (error) {
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

    const poll = await Poll.findById(pollId).populate('createdBy', 'name email').lean();
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const isOwnerOrAdmin =
      req.user &&
      (req.user.role === 'admin' ||
        poll.createdBy._id.toString() === req.user._id.toString());

    // Shield unapproved polls from unauthorized viewers
    const isApprovedOrPublished =
      poll.approvalStatus === 'approved' || poll.approvalStatus === 'published';
    if (!isApprovedOrPublished && !isOwnerOrAdmin) {
      res.status(403);
      throw new Error('Access denied. This poll is pending administrator approval.');
    }

    const resultsData = await voteService.buildResults(pollId);

    let participantVotes = [];
    if (isOwnerOrAdmin) {
      participantVotes = await voteService.getParticipantVotes(pollId, req.user);
    }

    res.json({
      success: true,
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        status: poll.status,
        expiryTime: poll.expiryTime,
        createdBy: poll.createdBy,
        approvalStatus: poll.approvalStatus,
      },
      ...resultsData,
      isCreator: isOwnerOrAdmin,
      participantVotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed participant votes for a poll (Creator or Admin only)
// @route   GET /api/polls/:pollId/participants
// @access  Private (Creator owner or Admin)
const getPollParticipants = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const participants = await voteService.getParticipantVotes(pollId, req.user);

    res.json({
      success: true,
      pollTitle: poll.title,
      totalVotes: participants.length,
      participants,
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
    const status = await voteService.checkUserVoteStatus(pollId, req.user._id);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    next(error);
  }
};

const buildResults = (pollId) => voteService.buildResults(pollId);

module.exports = {
  castVote,
  getResults,
  getVoteStatus,
  getPollParticipants,
  buildResults,
};
