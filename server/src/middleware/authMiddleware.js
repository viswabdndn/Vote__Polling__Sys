const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (never trust userId from body/query)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'User no longer exists.' });
    }

    // Check if account has been deactivated
    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated by an administrator.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'ROLE_FORBIDDEN',
      });
    }

    next();
  };
};

// Granular creator permission check (Admin always bypasses)
const checkCreatorPermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized.' });
    }

    // Admins have full access to all creator features
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only poll creators or administrators can perform this action.',
        code: 'CREATOR_REQUIRED',
      });
    }

    const perms = req.user.creatorPermissions || {};
    if (perms[permissionKey] === false) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: '${permissionKey}' has been revoked by an administrator.`,
        code: 'PERMISSION_REVOKED',
        permission: permissionKey,
      });
    }

    next();
  };
};

module.exports = { protect, authorize, checkCreatorPermission };
