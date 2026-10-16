const authService = require('../services/authService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with 7-digit ID or Email
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({
      success: true,
      message: 'Login successful.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
