const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  // Main image for the post (used as thumbnail/preview)
  imageUrl: {
    type: String,
    default: ''
  },
  // Legacy body field (for backward compatibility)
  body: {
    type: String,
    trim: true
  },
  // New content structure with paragraphs and images
  content: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      default: null
    }
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for likes count
PostSchema.virtual('likes').get(function() {
  return this.likedBy ? this.likedBy.length : 0;
});

// Middleware to ensure backward compatibility
PostSchema.pre('save', function(next) {
  // If content array exists but body is empty, generate body from content
  if (this.content && this.content.length > 0 && !this.body) {
    this.body = this.content.map(item => item.text).join('\n\n');
  }
  
  // If body exists but content is empty, create content from body
  if (this.body && (!this.content || this.content.length === 0)) {
    this.content = [{ text: this.body, image: null }];
  }
  
  next();
});

// Cascade delete comments when a post is deleted
PostSchema.pre('deleteOne', { document: true }, async function(next) {
  const Comment = mongoose.model('Comment');
  await Comment.deleteMany({ postId: this._id });
  next();
});

module.exports = mongoose.model('Post', PostSchema); 