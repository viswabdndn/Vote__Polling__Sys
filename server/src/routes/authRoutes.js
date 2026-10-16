const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
} = require('../middleware/validatorMiddleware');

// Public authentication routes with rate limiting and input validation
router.post('/register', authLimiter, registerValidationRules, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidationRules, handleValidationErrors, login);

// Authenticated user session
router.get('/me', protect, getMe);

module.exports = router;
