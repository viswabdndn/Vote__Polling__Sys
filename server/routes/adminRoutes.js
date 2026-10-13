const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly require valid authentication AND 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Admin Dashboard stats
router.get('/stats', getAdminStats);

// Poll Approval Queue (Admin Approvals)
router.get('/polls/pending', getPendingPolls);
router.put('/polls/:id/approve', approvePoll);
router.put('/polls/:id/reject', rejectPoll);

// Creator Management & Permissions
router.get('/creators', getCreators);
router.put('/creators/:id/status', updateCreatorStatus);
router.put('/creators/:id/permissions', updateCreatorPermissions);
router.delete('/creators/:id', deleteCreator);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// All Polls Management
router.get('/polls', getAdminPolls);

module.exports = router;
