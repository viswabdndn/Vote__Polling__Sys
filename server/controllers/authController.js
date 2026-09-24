const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    let { name, email, voterId, password, confirmPassword } = req.body;

    if (!name || !password || !confirmPassword) {
      res.status(400);
      throw new Error('Name and password fields are required.');
    }

    if (!email && !voterId) {
      res.status(400);
      throw new Error('Please provide either a Participant/Voter ID (e.g. 24104110) or an Email.');
    }

    if (password !== confirmPassword) {
      res.status(400);
      throw new Error('Passwords do not match.');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters.');
    }

    // If no email given, construct standard email from voterId
    if (!email && voterId) {
      email = `${voterId.trim()}@poll.local`;
    }

    // Clean voterId if present
    if (voterId) {
      voterId = voterId.trim();
      const existingVoter = await User.findOne({ voterId });
      if (existingVoter) {
        res.status(409);
        throw new Error('An account with this Participant/Voter ID already exists.');
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with this email already exists.');
    }

    // Create user (password hashing handled in pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      voterId: voterId || undefined,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        createdAt: user.createdAt,
      },
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
    const { email, identifier, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      res.status(400);
      throw new Error('Participant ID or Email and Password are required.');
    }

    // Extract prefix if user typed their college email e.g. 24104111@nec.edu.in -> 24104111
    const idPrefix = loginId.includes('@') ? loginId.split('@')[0].trim() : loginId;

    // Find user by: 1) exact email, 2) exact voterId, or 3) voterId from email prefix
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { voterId: loginId },
        { voterId: idPrefix },
      ],
    }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid Participant ID, Email, or Password.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid Participant ID, Email, or Password.');
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        createdAt: user.createdAt,
      },
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
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
