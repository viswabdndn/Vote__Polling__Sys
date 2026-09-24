const express = require('express');
const router = express.Router();
const {
  createPoll,
  getAllPolls,
  getActivePolls,
  getArchivedPolls,
  getMyPolls,
  getPollById,
  closePoll,
} = require('../controllers/pollController');
const {
  castVote,
  getResults,
  getVoteStatus,
} = require('../controllers/voteController');
const { protect } = require('../middleware/authMiddleware');

// All poll routes require authentication
router.use(protect);

// Poll CRUD
router.post('/', createPoll);
router.get('/', getAllPolls);
router.get('/active', getActivePolls);
router.get('/archive', getArchivedPolls);
router.get('/my', getMyPolls);
router.get('/:id', getPollById);
router.put('/:id/close', closePoll);

// Vote routes under polls
router.post('/:pollId/vote', castVote);
router.get('/:pollId/results', getResults);
router.get('/:pollId/vote-status', getVoteStatus);

module.exports = router;
