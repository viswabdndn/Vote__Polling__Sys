const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
      minlength: [1, 'Option text cannot be empty'],
      maxlength: [200, 'Option text cannot exceed 200 characters'],
    },
    voteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index for fast lookup of options by poll
optionSchema.index({ pollId: 1 });

module.exports = mongoose.model('Option', optionSchema);
