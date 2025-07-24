const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get comments for post
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Comment.countDocuments({ postId: req.params.id });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: comments.length,
      pages,
      comments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      body: req.body.body,
      author: req.user.id,
      postId: req.params.id
    });
    
    // Populate author for response
    const populatedComment = await Comment.findById(comment._id).populate('author', 'username profileImage');
    
    // Create notification for post author (if not the same as comment author)
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id
      });
    }

    res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Make sure user is comment owner
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { body: req.body.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('author', 'username profileImage');

    res.status(200).json({
      success: true,
      comment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Make sure user is comment owner
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();
    
    // Delete related notifications
    await Notification.deleteMany({ 
      type: 'comment',
      sender: req.user.id,
      post: comment.postId
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (err) {
    next(err);
  }
}; 