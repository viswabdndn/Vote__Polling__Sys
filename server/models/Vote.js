const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Option',
      required: true,
    },
  },
  { timestamps: true }
);

// *** CRITICAL: Compound unique index prevents duplicate votes at DB level ***
// Even if two simultaneous requests slip through application logic,
// MongoDB will reject the second insert with a duplicate key error (E11000)
voteSchema.index({ userId: 1, pollId: 1 }, { unique: true });

// Additional indexes for fast result queries
voteSchema.index({ pollId: 1 });
voteSchema.index({ optionId: 1 });

module.exports = mongoose.model('Vote', voteSchema);
