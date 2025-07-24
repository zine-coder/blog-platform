const mongoose = require('mongoose');

const HashtagFollowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hashtag: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for uniqueness and efficient querying
HashtagFollowSchema.index({ user: 1, hashtag: 1 }, { unique: true });

module.exports = mongoose.model('HashtagFollow', HashtagFollowSchema); 