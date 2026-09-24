const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Poll title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry date/time is required'],
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Virtual: check if poll is currently active (not expired and not manually closed)
pollSchema.virtual('isExpired').get(function () {
  return new Date() >= this.expiryTime;
});

// Virtual: effective status (considers both manual close and time expiry)
pollSchema.virtual('effectiveStatus').get(function () {
  if (this.status === 'closed' || new Date() >= this.expiryTime) {
    return 'closed';
  }
  return 'active';
});

pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Poll', pollSchema);
