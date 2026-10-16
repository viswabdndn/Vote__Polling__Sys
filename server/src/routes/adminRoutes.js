const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  pollIdParamRule,
  rejectPollValidationRules,
  updateUserRoleValidationRules,
  updateUserStatusValidationRules,
  updateCreatorPermissionsValidationRules,
  createCreatorValidationRules,
  handleValidationErrors,
} = require('../middleware/validatorMiddleware');

// All admin routes strictly require valid authentication AND 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Admin Dashboard stats
router.get('/stats', getAdminStats);

// Poll Approval Queue (Admin Approvals)
router.get('/polls/pending', getPendingPolls);
router.put('/polls/:id/approve', pollIdParamRule, handleValidationErrors, approvePoll);
router.put('/polls/:id/reject', rejectPollValidationRules, handleValidationErrors, rejectPoll);

// Creator Management & Permissions
router.get('/creators', getCreators);
router.post('/creators', createCreatorValidationRules, handleValidationErrors, createCreator);
router.put('/creators/:id/status', pollIdParamRule, handleValidationErrors, updateCreatorStatus);
router.put('/creators/:id/permissions', updateCreatorPermissionsValidationRules, handleValidationErrors, updateCreatorPermissions);
router.delete('/creators/:id', pollIdParamRule, handleValidationErrors, deleteCreator);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatusValidationRules, handleValidationErrors, updateUserStatus);
router.put('/users/:id/role', updateUserRoleValidationRules, handleValidationErrors, updateUserRole);
router.delete('/users/:id', pollIdParamRule, handleValidationErrors, deleteUser);

// All Polls Management
router.get('/polls', getAdminPolls);

module.exports = router;
