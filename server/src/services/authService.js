const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const registerUser = async ({ name, email, voterId, password, confirmPassword, role }) => {
  if (!name || !password || !confirmPassword) {
    const err = new Error('Name and password fields are required.');
    err.statusCode = 400;
    throw err;
  }

  if (!email && !voterId) {
    const err = new Error('Please provide either a Participant/Voter ID (e.g. 24104110) or an Email.');
    err.statusCode = 400;
    throw err;
  }

  if (password !== confirmPassword) {
    const err = new Error('Passwords do not match.');
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters.');
    err.statusCode = 400;
    throw err;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    const err = new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    err.statusCode = 400;
    throw err;
  }

  // Security check: Never allow registering as Admin from public endpoint
  let assignedRole = 'participant';
  if (role === 'admin') {
    const err = new Error('Admin accounts cannot be registered publicly.');
    err.statusCode = 403;
    throw err;
  } else if (role === 'creator') {
    assignedRole = 'creator';
  } else if (role && role !== 'participant') {
    const err = new Error("Invalid role specified. Role must be 'participant' or 'creator'.");
    err.statusCode = 400;
    throw err;
  }

  // If no email given, construct standard email from voterId
  let normalizedEmail = email ? email.toLowerCase().trim() : undefined;
  if (!normalizedEmail && voterId) {
    normalizedEmail = `${voterId.trim()}@poll.local`;
  }

  let cleanVoterId = voterId ? voterId.trim() : undefined;
  if (cleanVoterId) {
    const existingVoter = await User.findOne({ voterId: cleanVoterId });
    if (existingVoter) {
      const err = new Error('An account with this Participant/Voter ID already exists.');
      err.statusCode = 409;
      throw err;
    }
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Create user (password hashing handled in User pre-save hook with salt >= 12)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    voterId: cleanVoterId || undefined,
    password,
    role: assignedRole,
    isActive: true,
    creatorPermissions: {
      canCreatePoll: true,
      canEditPoll: true,
      canPublishPoll: true,
      canDeletePoll: true,
    },
  });

  const token = generateToken(user._id);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      voterId: user.voterId,
      role: user.role,
      isActive: user.isActive,
      creatorPermissions: user.creatorPermissions,
      createdAt: user.createdAt,
    },
  };
};

const loginUser = async ({ identifier, email, password }) => {
  const loginId = (identifier || email || '').trim();

  if (!loginId || !password) {
    const err = new Error('Participant ID or Email and Password are required.');
    err.statusCode = 400;
    throw err;
  }

  // Extract prefix if user typed their college email e.g. 24104111@nec.edu.in -> 24104111
  const idPrefix = loginId.includes('@') ? loginId.split('@')[0].trim() : loginId;

  // Find user by exact email, exact voterId, or voterId from email prefix
  const user = await User.findOne({
    $or: [
      { email: loginId.toLowerCase() },
      { voterId: loginId },
      { voterId: idPrefix },
    ],
  }).select('+password');

  if (!user) {
    const err = new Error('Invalid Participant ID, Email, or Password.');
    err.statusCode = 401;
    throw err;
  }

  // Verify password first to prevent user enumeration
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const err = new Error('Invalid Participant ID, Email, or Password.');
    err.statusCode = 401;
    throw err;
  }

  // Only after password verification check if account is deactivated
  if (user.isActive === false) {
    const err = new Error('Your account has been deactivated by an administrator. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      voterId: user.voterId,
      role: user.role,
      isActive: user.isActive,
      creatorPermissions: user.creatorPermissions,
      createdAt: user.createdAt,
    },
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.isActive === false) {
    const err = new Error('Your account has been deactivated by an administrator.');
    err.statusCode = 403;
    throw err;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    voterId: user.voterId,
    role: user.role,
    isActive: user.isActive,
    creatorPermissions: user.creatorPermissions,
    createdAt: user.createdAt,
  };
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getCurrentUser,
};
