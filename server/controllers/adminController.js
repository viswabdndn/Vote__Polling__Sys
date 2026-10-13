const User = require('../models/User');
const Poll = require('../models/Poll');
const Option = require('../models/Option');
const Vote = require('../models/Vote');

// @desc    Get system-wide overview statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCreators,
        totalParticipants,
        totalAdmins,
        totalPolls,
        activePolls,
        closedPolls,
        pendingApprovals,
        totalVotes,
      },
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
    const creators = await User.find({ role: 'creator' })
      .select('-password')
      .sort({ createdAt: -1 });

    const creatorIds = creators.map((c) => c._id);

    // Aggregate poll statistics per creator
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

    const enrichedCreators = creators.map((creator) => {
      const stats = statsMap[creator._id.toString()] || {
        totalPolls: 0,
        activePolls: 0,
      };
      return {
        ...creator.toJSON(),
        stats,
      };
    });

    res.json({
      success: true,
      creators: enrichedCreators,
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
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Creator not found.');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot deactivate your own administrative account.');
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      success: true,
      message: `Creator account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        creatorPermissions: user.creatorPermissions,
      },
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
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Creator not found.');
    }

    if (user.role !== 'creator') {
      res.status(400);
      throw new Error('Permissions can only be managed for Creator accounts.');
    }

    const {
      canCreatePoll,
      canEditPoll,
      canPublishPoll,
      canDeletePoll,
    } = req.body;

    user.creatorPermissions = {
      canCreatePoll: typeof canCreatePoll === 'boolean' ? canCreatePoll : user.creatorPermissions?.canCreatePoll ?? true,
      canEditPoll: typeof canEditPoll === 'boolean' ? canEditPoll : user.creatorPermissions?.canEditPoll ?? true,
      canPublishPoll: typeof canPublishPoll === 'boolean' ? canPublishPoll : user.creatorPermissions?.canPublishPoll ?? true,
      canDeletePoll: typeof canDeletePoll === 'boolean' ? canDeletePoll : user.creatorPermissions?.canDeletePoll ?? true,
    };

    await user.save();

    res.json({
      success: true,
      message: 'Creator permissions updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        creatorPermissions: user.creatorPermissions,
      },
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
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Creator not found.');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account.');
    }

    // Find all polls by this creator
    const creatorPolls = await Poll.find({ createdBy: user._id });
    const pollIds = creatorPolls.map((p) => p._id);

    // Cascading delete: votes, options, polls
    if (pollIds.length > 0) {
      await Vote.deleteMany({ pollId: { $in: pollIds } });
      await Option.deleteMany({ pollId: { $in: pollIds } });
      await Poll.deleteMany({ _id: { $in: pollIds } });
    }

    // Delete any votes the creator personally cast
    await Vote.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: `Creator '${user.name}' and all ${pollIds.length} associated polls were successfully removed.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering and search
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, q } = req.query;
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

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
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
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot deactivate your own account.');
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
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
    const { role } = req.body;
    if (!['admin', 'creator', 'participant'].includes(role)) {
      res.status(400);
      throw new Error("Invalid role specified. Must be 'admin', 'creator', or 'participant'.");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      res.status(400);
      throw new Error('You cannot demote yourself from the Admin role.');
    }

    user.role = role;

    // Initialize default creator permissions if promoted to creator
    if (role === 'creator' && !user.creatorPermissions) {
      user.creatorPermissions = {
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: `User role updated to '${role}'.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        creatorPermissions: user.creatorPermissions,
      },
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
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own administrative account.');
    }

    // Clean up if creator
    const creatorPolls = await Poll.find({ createdBy: user._id });
    const pollIds = creatorPolls.map((p) => p._id);
    if (pollIds.length > 0) {
      await Vote.deleteMany({ pollId: { $in: pollIds } });
      await Option.deleteMany({ pollId: { $in: pollIds } });
      await Poll.deleteMany({ _id: { $in: pollIds } });
    }

    // Delete votes cast by this user
    await Vote.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: `User '${user.name}' was successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all polls across all creators with analytics
// @route   GET /api/admin/polls
// @access  Private (Admin only)
const getAdminPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name email voterId')
      .sort({ createdAt: -1 });

    const pollIds = polls.map((p) => p._id);
    const options = await Option.find({ pollId: { $in: pollIds } });

    const voteDocs = await Vote.aggregate([
      { $match: { pollId: { $in: pollIds } } },
      { $group: { _id: '$pollId', count: { $sum: 1 } } },
    ]);

    const voteCounts = {};
    voteDocs.forEach((v) => {
      voteCounts[v._id.toString()] = v.count;
    });

    const enrichedPolls = polls.map((poll) => {
      const pollObj = poll.toJSON();
      pollObj.options = options.filter(
        (o) => o.pollId.toString() === poll._id.toString()
      );
      pollObj.totalVotes = voteCounts[poll._id.toString()] || 0;
      return pollObj;
    });

    res.json({
      success: true,
      polls: enrichedPolls,
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
    const polls = await Poll.find({ approvalStatus: 'pending' })
      .populate('createdBy', 'name email voterId')
      .sort({ createdAt: -1 });

    const pollIds = polls.map((p) => p._id);
    const options = await Option.find({ pollId: { $in: pollIds } });

    const enriched = polls.map((p) => {
      const obj = p.toJSON();
      obj.options = options.filter(
        (o) => o.pollId.toString() === p._id.toString()
      );
      return obj;
    });

    res.json({
      success: true,
      count: enriched.length,
      polls: enriched,
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
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const { title, description, expiryTime, options } = req.body;

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

    // Update or add options if provided
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
    poll.approvedBy = req.user._id;
    poll.approvedAt = new Date();
    poll.status = 'active';
    poll.rejectionReason = '';

    await poll.save();

    const updatedOptions = await Option.find({ pollId: poll._id });

    res.json({
      success: true,
      message: `Poll "${poll.title}" has been approved and published for voting.`,
      poll: {
        ...poll.toJSON(),
        options: updatedOptions,
      },
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
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      res.status(404);
      throw new Error('Poll not found.');
    }

    const { reason } = req.body;

    poll.approvalStatus = 'rejected';
    poll.rejectionReason = (reason || 'Does not meet polling criteria.').trim();
    await poll.save();

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
