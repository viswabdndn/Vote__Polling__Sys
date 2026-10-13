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
router.put('/:id', updatePoll);
router.put('/:id/close', closePoll);
router.put('/:id/status', togglePollStatus);
router.delete('/:id', deletePoll);

// Vote routes under polls
router.post('/:pollId/vote', castVote);
router.get('/:pollId/results', getResults);
router.get('/:pollId/participants', getPollParticipants);
router.get('/:pollId/vote-status', getVoteStatus);

module.exports = router;
