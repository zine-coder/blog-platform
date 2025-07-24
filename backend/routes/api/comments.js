const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  addComment,
  updateComment,
  deleteComment
} = require('../../controllers/commentController');
const { protect } = require('../../middleware/auth');
const { validateComment } = require('../../middleware/validation');

// @route   GET /api/posts/:id/comments
// @desc    Get all comments for a post
// @access  Public
router.get('/', getComments);

// @route   POST /api/posts/:id/comments
// @desc    Add comment to post
// @access  Private
router.post('/', protect, validateComment, addComment);

// Routes for /api/comments
const commentRouter = express.Router();

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private
commentRouter.put('/:id', protect, validateComment, updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private
commentRouter.delete('/:id', protect, deleteComment);

module.exports = router;
module.exports.commentRouter = commentRouter; 