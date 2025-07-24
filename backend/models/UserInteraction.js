const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserInteractionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous interactions
  },
  interactionType: {
    type: String,
    required: true,
    enum: ['view', 'like', 'comment', 'share', 'bookmark', 'search', 'click']
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: false
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  hashtag: {
    type: String,
    required: false
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for common queries
UserInteractionSchema.index({ user: 1, interactionType: 1 });
UserInteractionSchema.index({ interactionType: 1, createdAt: -1 });
UserInteractionSchema.index({ post: 1, interactionType: 1 });
UserInteractionSchema.index({ 'metadata.query': 1 }, { sparse: true });

module.exports = mongoose.model('UserInteraction', UserInteractionSchema); 