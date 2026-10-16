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
      enum: ['draft', 'active', 'closed'],
      default: 'active',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'published', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Database Indexes for high-performance querying and pagination
pollSchema.index({ approvalStatus: 1, status: 1, expiryTime: 1 });
pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ createdAt: -1 });
pollSchema.index({ expiryTime: 1 });

// Virtual: check if poll is currently expired by time
pollSchema.virtual('isExpired').get(function () {
  return Boolean(this.expiryTime && new Date() >= this.expiryTime);
});

// Virtual: effective status (considers draft, approval, manual close, and time expiry)
pollSchema.virtual('effectiveStatus').get(function () {
  if (this.approvalStatus === 'draft' || this.status === 'draft') {
    return 'draft';
  }
  if (this.approvalStatus === 'pending') {
    return 'pending';
  }
  if (this.approvalStatus === 'rejected') {
    return 'rejected';
  }
  if (this.status === 'closed' || (this.expiryTime && new Date() >= this.expiryTime)) {
    return 'closed';
  }
  return 'active';
});

pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Poll', pollSchema);
