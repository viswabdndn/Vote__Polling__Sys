// 404 handler — route not found
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler — consistent JSON error shape, no stack traces in production
const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || undefined;

  // Mongoose: Bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (invalid ID format)';
    errorCode = 'INVALID_ID';
  }

  // Mongoose: Schema Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // MongoDB: Duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    if (fields.includes('userId') || fields.includes('pollId')) {
      message = 'You have already voted in this poll.';
      errorCode = 'DUPLICATE_VOTE';
    } else if (fields.includes('email')) {
      message = 'An account with this email address already exists.';
      errorCode = 'DUPLICATE_EMAIL';
    } else if (fields.includes('voterId')) {
      message = 'An account with this Participant ID already exists.';
      errorCode = 'DUPLICATE_VOTER_ID';
    } else {
      message = `Duplicate key error for field(s): ${fields.join(', ')}`;
      errorCode = 'DUPLICATE_KEY';
    }
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
    errorCode = 'TOKEN_EXPIRED';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
    errorCode = 'INVALID_TOKEN';
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { code: errorCode }),
    ...(isDevelopment && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
