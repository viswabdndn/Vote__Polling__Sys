const pollService = require('../services/pollService');

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private (Admin or Creator with permission)
const createPoll = async (req, res, next) => {
  try {
    const { title, description, options, startTime, expiryTime } = req.body;
    const result = await pollService.createPoll({
      user: req.user,
      title,
      description,
      options,
      startTime,
      expiryTime,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      poll: result.poll,
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
    const result = await pollService.getAllPolls({
      user: req.user,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get only active (approved and non-expired) polls
// @route   GET /api/polls/active
// @access  Private
const getActivePolls = async (req, res, next) => {
  try {
    const result = await pollService.getActivePolls({
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get archived/closed polls (approved and closed or expired)
// @route   GET /api/polls/archive
// @access  Private
const getArchivedPolls = async (req, res, next) => {
  try {
    const result = await pollService.getArchivedPolls({
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get polls created by the logged-in user
// @route   GET /api/polls/my
// @access  Private (Owner creator or Admin)
const getMyPolls = async (req, res, next) => {
  try {
    const result = await pollService.getMyPolls({
      user: req.user,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single poll by ID
// @route   GET /api/polls/:id
// @access  Private
const getPollById = async (req, res, next) => {
  try {
    const poll = await pollService.getPollById({
      pollId: req.params.id,
      user: req.user,
    });

    res.json({
      success: true,
      poll,
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
    const { title, description, expiryTime, status } = req.body;
    const result = await pollService.updatePoll({
      pollId: req.params.id,
      user: req.user,
      title,
      description,
      expiryTime,
      status,
    });

    res.json({
      success: true,
      message: 'Poll updated successfully.',
      poll: result.poll,
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
    const poll = await pollService.closePoll({
      pollId: req.params.id,
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Poll closed successfully.',
      poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle poll status between active and closed
// @route   PUT /api/polls/:id/status
// @access  Private (creator owner or admin)
const togglePollStatus = async (req, res, next) => {
  try {
    const poll = await pollService.togglePollStatus({
      pollId: req.params.id,
      user: req.user,
    });

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
    await pollService.deletePoll({
      pollId: req.params.id,
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Poll and all associated options and votes deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

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
