const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to extract and format validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(400).json({
      success: false,
      message: errorList[0].msg,
      errors: errorList.map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};

// Check if string is a valid Mongo ObjectId
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Auth Validation Rules
const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters.')
    .escape(),

  body('voterId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9a-zA-Z]{4,15}$/)
    .withMessage('Participant ID must be 4 to 15 alphanumeric characters (e.g. 24104110).'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body().custom((value, { req }) => {
    const hasEmail = Boolean(req.body.email && req.body.email.trim());
    const hasVoterId = Boolean(req.body.voterId && req.body.voterId.trim());
    if (!hasEmail && !hasVoterId) {
      throw new Error('Please provide either a Participant ID (e.g. 24104110) or an Email.');
    }
    return true;
  }),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  body('role')
    .optional()
    .custom((role) => {
      if (role === 'admin') {
        throw new Error('Admin accounts cannot be registered publicly.');
      }
      if (role && !['participant', 'creator'].includes(role)) {
        throw new Error("Invalid role specified. Role must be 'participant' or 'creator'.");
      }
      return true;
    }),
];

const loginValidationRules = [
  body('identifier')
    .optional()
    .trim(),
  body('email')
    .optional()
    .trim(),
  body().custom((value, { req }) => {
    const id = (req.body.identifier || req.body.email || '').trim();
    if (!id) {
      throw new Error('Participant ID or Email is required.');
    }
    return true;
  }),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

// Poll Validation Rules
const pollIdParamRule = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid Poll ID format.'),
];

const pollIdInParamsRule = [
  param('pollId')
    .custom(isValidObjectId)
    .withMessage('Invalid Poll ID format.'),
];

const createPollValidationRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Poll title is required.')
    .isLength({ min: 5, max: 200 })
    .withMessage('Poll title must be between 5 and 200 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('A poll must have between 2 and 10 voting options.')
    .custom((options) => {
      const texts = options.map((opt) =>
        (typeof opt === 'string' ? opt : (opt?.text || '')).trim()
      );
      if (texts.some((t) => !t || t.length === 0)) {
        throw new Error('Option text cannot be empty.');
      }
      if (texts.some((t) => t.length > 200)) {
        throw new Error('Option text cannot exceed 200 characters.');
      }
      const unique = new Set(texts.map((t) => t.toLowerCase()));
      if (unique.size !== texts.length) {
        throw new Error('Duplicate option names are not allowed.');
      }
      return true;
    }),

  body('expiryTime')
    .notEmpty()
    .withMessage('Expiry date/time is required.')
    .isISO8601()
    .withMessage('Expiry date/time must be a valid ISO date.')
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error('Expiry date/time must be in the future.');
      }
      return true;
    }),
];

const updatePollValidationRules = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid Poll ID format.'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Poll title must be between 5 and 200 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
  body('expiryTime')
    .optional()
    .isISO8601()
    .withMessage('Expiry date/time must be a valid ISO date.')
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error('Expiry date/time must be in the future.');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'closed'])
    .withMessage("Status must be either 'active' or 'closed'."),
];

// Vote Validation Rules
const voteValidationRules = [
  param('pollId')
    .custom(isValidObjectId)
    .withMessage('Invalid Poll ID format.'),
  body('optionId')
    .notEmpty()
    .withMessage('Please select an option.')
    .custom(isValidObjectId)
    .withMessage('Invalid Option ID format.'),
];

// Admin Validation Rules
const updateUserRoleValidationRules = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid User ID format.'),
  body('role')
    .isIn(['admin', 'creator', 'participant'])
    .withMessage("Invalid role specified. Must be 'admin', 'creator', or 'participant'."),
];

const updateUserStatusValidationRules = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid User ID format.'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value.'),
];

const updateCreatorPermissionsValidationRules = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid User ID format.'),
  body('canCreatePoll').optional().isBoolean().withMessage('canCreatePoll must be a boolean.'),
  body('canEditPoll').optional().isBoolean().withMessage('canEditPoll must be a boolean.'),
  body('canPublishPoll').optional().isBoolean().withMessage('canPublishPoll must be a boolean.'),
  body('canDeletePoll').optional().isBoolean().withMessage('canDeletePoll must be a boolean.'),
];

const rejectPollValidationRules = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid Poll ID format.'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters.'),
];

const createCreatorValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters.')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
  body('voterId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9a-zA-Z]{4,15}$/)
    .withMessage('Participant/Staff ID must be 4 to 15 alphanumeric characters.'),
  body('canCreatePoll').optional().isBoolean().withMessage('canCreatePoll must be a boolean.'),
  body('canEditPoll').optional().isBoolean().withMessage('canEditPoll must be a boolean.'),
  body('canPublishPoll').optional().isBoolean().withMessage('canPublishPoll must be a boolean.'),
  body('canDeletePoll').optional().isBoolean().withMessage('canDeletePoll must be a boolean.'),
];

module.exports = {
  handleValidationErrors,
  registerValidationRules,
  loginValidationRules,
  pollIdParamRule,
  pollIdInParamsRule,
  createPollValidationRules,
  updatePollValidationRules,
  voteValidationRules,
  updateUserRoleValidationRules,
  updateUserStatusValidationRules,
  updateCreatorPermissionsValidationRules,
  rejectPollValidationRules,
  createCreatorValidationRules,
};
