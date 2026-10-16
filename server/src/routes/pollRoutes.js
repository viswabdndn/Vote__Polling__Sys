const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/pollController');
const {
  castVote,
  getResults,
  getVoteStatus,
  getPollParticipants,
} = require('../controllers/voteController');
const { protect, authorize, checkCreatorPermission } = require('../middleware/authMiddleware');
const { voteLimiter } = require('../middleware/rateLimiter');
const {
  pollIdParamRule,
  pollIdInParamsRule,
  createPollValidationRules,
  updatePollValidationRules,
  voteValidationRules,
  handleValidationErrors,
} = require('../middleware/validatorMiddleware');

// All poll routes require authentication
router.use(protect);

// Poll CRUD
// Creating a poll is restricted to Admin and Creator (with canCreatePoll permission)
router.post(
  '/',
  authorize('admin', 'creator'),
  checkCreatorPermission('canCreatePoll'),
  createPollValidationRules,
  handleValidationErrors,
  createPoll
);

router.get('/', getAllPolls);
router.get('/active', getActivePolls);
router.get('/archive', getArchivedPolls);
router.get('/my', authorize('admin', 'creator'), getMyPolls);
router.get('/:id', pollIdParamRule, handleValidationErrors, getPollById);

// Editing, closing, toggling, and deleting polls require admin or creator role + permissions
router.put(
  '/:id',
  authorize('admin', 'creator'),
  checkCreatorPermission('canEditPoll'),
  updatePollValidationRules,
  handleValidationErrors,
  updatePoll
);

router.put(
  '/:id/close',
  authorize('admin', 'creator'),
  checkCreatorPermission('canPublishPoll'),
  pollIdParamRule,
  handleValidationErrors,
  closePoll
);

router.put(
  '/:id/status',
  authorize('admin', 'creator'),
  checkCreatorPermission('canPublishPoll'),
  pollIdParamRule,
  handleValidationErrors,
  togglePollStatus
);

router.delete(
  '/:id',
  authorize('admin', 'creator'),
  checkCreatorPermission('canDeletePoll'),
  pollIdParamRule,
  handleValidationErrors,
  deletePoll
);

// Voting and Vote queries (Admins excluded: they manage and govern)
router.post(
  '/:pollId/vote',
  authorize('participant', 'creator'),
  voteLimiter,
  voteValidationRules,
  handleValidationErrors,
  castVote
);

router.get('/:pollId/results', pollIdInParamsRule, handleValidationErrors, getResults);
router.get(
  '/:pollId/participants',
  authorize('admin', 'creator'),
  pollIdInParamsRule,
  handleValidationErrors,
  getPollParticipants
);
router.get('/:pollId/vote-status', pollIdInParamsRule, handleValidationErrors, getVoteStatus);

module.exports = router;
