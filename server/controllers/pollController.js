const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private
const createPoll = async (req, res, next) => {
  try {
    // Ensure participants cannot create polls
    if (req.user.role === 'participant') {
      res.status(403);
      throw new Error('Participants are only allowed to answer/vote in polls. Only poll creators can create polls.');
    }

    // Check creator permission
    if (req.user.role === 'creator' && req.user.creatorPermissions?.canCreatePoll === false) {
      res.status(403);
      throw new Error('Permission denied: Permission to create polls has been revoked by an administrator.');
    }

    const { title, description, options, startTime, expiryTime } = req.body;

    // Validate required fields
    if (!title || !expiryTime || !options) {
      res.status(400);
      throw new Error('Title, expiry time, and options are required.');
    }

    if (!Array.isArray(options) || options.length < 2) {
      res.status(400);
      throw new Error('At least two voting options are required.');
    }

    // Validate option texts
    const cleanOptions = options.map((o) =>
      typeof o === 'string' ? o.trim() : (o.text || '').trim()
    );

    if (cleanOptions.some((o) => !o)) {
      res.status(400);
      throw new Error('Option text cannot be empty.');
    }

    // Check for duplicate options
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      res.status(400);
      throw new Error('Duplicate option names are not allowed.');
    }

    // Validate expiry time
    const expiry = new Date(expiryTime);
    if (isNaN(expiry.getTime())) {
      res.status(400);
      throw new Error('Invalid expiry date/time.');
    }
    if (expiry <= new Date()) {
      res.status(400);
      throw new Error('Expiry date/time must be in the future.');
    }

    const isAdmin = req.user.role === 'admin';
    const approvalStatus = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? req.user._id : undefined;
    const approvedAt = isAdmin ? new Date() : undefined;

    // Create poll
    const poll = await Poll.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      startTime: startTime ? new Date(startTime) : new Date(),
      expiryTime: expiry,
      status: 'active',
      approvalStatus,
      approvedBy,
      approvedAt,
    });

    // Create options linked to poll
    const optionDocs = await Option.insertMany(
      cleanOptions.map((text) => ({ pollId: poll._id, text }))
    );

    const message = isAdmin
      ? 'Poll created and published successfully.'
      : 'Poll submitted successfully. It has been sent to the administrator for review and approval.';

    res.status(201).json({
      success: true,
      message,
      poll: {
        ...poll.toJSON(),
        options: optionDocs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls (with options and creator)
// @route   GET /api/polls
// @access  Private
const getAllPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const pollsWithOptions = await attachOptions(polls, true);

    res.json({ success: true, polls: pollsWithOptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get only active (approved and non-expired) polls
// @route   GET /api/polls/active
// @access  Private
const getActivePolls = async (req, res, next) => {
  try {
    const now = new Date();
    const polls = await Poll.find({
      approvalStatus: 'approved',
      status: 'active',
      expiryTime: { $gt: now },
    })
      .populate('createdBy', 'name email')
      .sort({ expiryTime: 1 });

    const pollsWithOptions = await attachOptions(polls);

    res.json({ success: true, polls: pollsWithOptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get archived/closed polls (approved and closed or expired)
// @route   GET /api/polls/archive
// @access  Private
const getArchivedPolls = async (req, res, next) => {
  try {
    const now = new Date();
    const polls = await Poll.find({
      approvalStatus: 'approved',
      $or: [{ status: 'closed' }, { expiryTime: { $lte: now } }],
    })
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    const pollsWithOptions = await attachOptions(polls, true);

    res.json({ success: true, polls: pollsWithOptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get polls created by the logged-in user
// @route   GET /api/polls/my
// @access  Private
const getMyPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    const pollsWithOptions = await attachOptions(polls, true);

    res.json({ success: true, polls: pollsWithOptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single poll by ID
// @route   GET /api/polls/:id
// @access  Private
const getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email voterId')
      .populate('approvedBy', 'name email');

    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const options = await Option.find({ pollId: poll._id });
    const totalVotes = await Vote.countDocuments({ pollId: poll._id });

    res.json({
      success: true,
      poll: {
        ...poll.toJSON(),
        options,
        totalVotes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a poll (Admin or Poll Creator with permission)
// @route   PUT /api/polls/:id
// @access  Private (Owner creator or Admin)
const updatePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const isOwner = poll.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Ownership check: Creators cannot edit other creators' polls
    if (!isAdmin && !isOwner) {
      res.status(403);
      throw new Error('Forbidden: You can only edit polls you created.');
    }

    // Permission check for creator
    if (!isAdmin && req.user.creatorPermissions?.canEditPoll === false) {
      res.status(403);
      throw new Error('Permission denied: Permission to edit polls has been revoked by an administrator.');
    }

    const { title, description, expiryTime, status } = req.body;

    if (title && title.trim().length >= 5) {
      poll.title = title.trim();
    }
    if (typeof description === 'string') {
      poll.description = description.trim();
    }
    if (expiryTime) {
      const exp = new Date(expiryTime);
      if (isNaN(exp.getTime())) {
        res.status(400);
        throw new Error('Invalid expiry date/time.');
      }
      poll.expiryTime = exp;
    }
    if (status && ['active', 'closed'].includes(status)) {
      if (!isAdmin && req.user.creatorPermissions?.canPublishPoll === false) {
        res.status(403);
        throw new Error('Permission denied: Permission to publish or change poll status has been revoked.');
      }
      poll.status = status;
    }

    await poll.save();

    const options = await Option.find({ pollId: poll._id });
    res.json({
      success: true,
      message: 'Poll updated successfully.',
      poll: {
        ...poll.toJSON(),
        options,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a poll manually (Admin or Owner with canPublishPoll)
// @route   PUT /api/polls/:id/close
// @access  Private (creator owner or admin)
const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const isOwner = poll.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Ownership check
    if (!isAdmin && !isOwner) {
      res.status(403);
      throw new Error('Forbidden: You are not authorized to close this poll.');
    }

    // Permission check for creator
    if (!isAdmin && req.user.creatorPermissions?.canPublishPoll === false) {
      res.status(403);
      throw new Error('Permission denied: Permission to publish or close polls has been revoked by an administrator.');
    }

    if (poll.status === 'closed') {
      res.status(400);
      throw new Error('Poll is already closed.');
    }

    poll.status = 'closed';
    await poll.save();

    res.json({ success: true, message: 'Poll closed successfully.', poll });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle poll status between active and closed
// @route   PUT /api/polls/:id/status
// @access  Private (creator owner or admin)
const togglePollStatus = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const isOwner = poll.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Ownership check
    if (!isAdmin && !isOwner) {
      res.status(403);
      throw new Error('Forbidden: You are not authorized to manage this poll.');
    }

    // Permission check for creator
    if (!isAdmin && req.user.creatorPermissions?.canPublishPoll === false) {
      res.status(403);
      throw new Error('Permission denied: Permission to publish or change poll status has been revoked by an administrator.');
    }

    poll.status = poll.status === 'active' ? 'closed' : 'active';
    await poll.save();

    res.json({
      success: true,
      message: `Poll status updated to ${poll.status}.`,
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a poll (Admin or Owner with canDeletePoll)
// @route   DELETE /api/polls/:id
// @access  Private (creator owner or admin)
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const isOwner = poll.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Ownership check: Creators cannot delete other creators' polls
    if (!isAdmin && !isOwner) {
      res.status(403);
      throw new Error('Forbidden: You can only delete polls you created.');
    }

    // Permission check for creator
    if (!isAdmin && req.user.creatorPermissions?.canDeletePoll === false) {
      res.status(403);
      throw new Error('Permission denied: Permission to delete polls has been revoked by an administrator.');
    }

    // Delete associated votes and options
    await Vote.deleteMany({ pollId: poll._id });
    await Option.deleteMany({ pollId: poll._id });
    await Poll.findByIdAndDelete(poll._id);

    res.json({
      success: true,
      message: 'Poll and all associated options and votes deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Helper: attach options (and optionally total votes) to polls array
async function attachOptions(polls, includeVotes = false) {
  const pollIds = polls.map((p) => p._id);
  const options = await Option.find({ pollId: { $in: pollIds } });

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
    const pollObj = poll.toJSON();
    pollObj.options = options.filter(
      (o) => o.pollId.toString() === poll._id.toString()
    );
    if (includeVotes) {
      pollObj.totalVotes = voteCounts[poll._id.toString()] || 0;
    }
    return pollObj;
  });
}

module.exports = {
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
