const adminService = require('../services/adminService');

// @desc    Get system-wide overview statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all creators with their permissions and poll stats
// @route   GET /api/admin/creators
// @access  Private (Admin only)
const getCreators = async (req, res, next) => {
  try {
    const creators = await adminService.getCreators();
    res.json({
      success: true,
      creators,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Creator account by administrator
// @route   POST /api/admin/creators
// @access  Private (Admin only)
const createCreator = async (req, res, next) => {
  try {
    const creator = await adminService.createCreator({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      voterId: req.body.voterId,
      permissions: {
        canCreatePoll: req.body.canCreatePoll,
        canEditPoll: req.body.canEditPoll,
        canPublishPoll: req.body.canPublishPoll,
        canDeletePoll: req.body.canDeletePoll,
      },
    });

    res.status(201).json({
      success: true,
      message: `Creator account '${creator.name}' created successfully.`,
      creator,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or update creator active status
// @route   PUT /api/admin/creators/:id/status
// @access  Private (Admin only)
const updateCreatorStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateCreatorStatus({
      creatorId: req.params.id,
      currentUserId: req.user._id,
      isActive: req.body.isActive,
    });

    res.json({
      success: true,
      message: `Creator account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update granular permissions for a creator
// @route   PUT /api/admin/creators/:id/permissions
// @access  Private (Admin only)
const updateCreatorPermissions = async (req, res, next) => {
  try {
    const user = await adminService.updateCreatorPermissions({
      creatorId: req.params.id,
      permissions: req.body,
    });

    res.json({
      success: true,
      message: 'Creator permissions updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove/delete a creator account and cleanup their polls
// @route   DELETE /api/admin/creators/:id
// @access  Private (Admin only)
const deleteCreator = async (req, res, next) => {
  try {
    const { deletedPollCount, userName } = await adminService.deleteCreator({
      creatorId: req.params.id,
      currentUserId: req.user._id,
    });

    res.json({
      success: true,
      message: `Creator '${userName}' and all ${deletedPollCount} associated polls were successfully removed.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering, search, and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers({
      role: req.query.role,
      status: req.query.status,
      q: req.query.q,
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

// @desc    Update any user's active status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus({
      userId: req.params.id,
      currentUserId: req.user._id,
      isActive: req.body.isActive,
    });

    res.json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change a user's role (Admin, Creator, Participant)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole({
      userId: req.params.id,
      currentUserId: req.user._id,
      role: req.body.role,
    });

    res.json({
      success: true,
      message: `User role updated to '${user.role}'.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const userName = await adminService.deleteUser({
      userId: req.params.id,
      currentUserId: req.user._id,
    });

    res.json({
      success: true,
      message: `User '${userName}' was successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls across all creators with analytics and pagination
// @route   GET /api/admin/polls
// @access  Private (Admin only)
const getAdminPolls = async (req, res, next) => {
  try {
    const result = await adminService.getAdminPolls({
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

// @desc    Get all polls awaiting admin approval
// @route   GET /api/admin/polls/pending
// @access  Private (Admin only)
const getPendingPolls = async (req, res, next) => {
  try {
    const polls = await adminService.getPendingPolls();
    res.json({
      success: true,
      count: polls.length,
      polls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending poll (and optionally edit/add options)
// @route   PUT /api/admin/polls/:id/approve
// @access  Private (Admin only)
const approvePoll = async (req, res, next) => {
  try {
    const result = await adminService.approvePoll({
      pollId: req.params.id,
      adminId: req.user._id,
      title: req.body.title,
      description: req.body.description,
      expiryTime: req.body.expiryTime,
      options: req.body.options,
    });

    res.json({
      success: true,
      message: `Poll "${result.poll.title}" has been approved and published for voting.`,
      poll: result.poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a pending poll
// @route   PUT /api/admin/polls/:id/reject
// @access  Private (Admin only)
const rejectPoll = async (req, res, next) => {
  try {
    const poll = await adminService.rejectPoll({
      pollId: req.params.id,
      reason: req.body.reason,
    });

    res.json({
      success: true,
      message: `Poll "${poll.title}" has been rejected.`,
      poll,
    });
  } catch (error) {
    next(error);
  }
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
