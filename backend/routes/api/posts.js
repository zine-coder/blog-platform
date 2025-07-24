const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  getPostsByHashtag
} = require('../../controllers/postController');
const { getComments, addComment } = require('../../controllers/commentController');
const { protect, requireAuth, checkOwnership } = require('../../middleware/auth');
const { validatePost } = require('../../middleware/validation');

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', getPosts);

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, requireAuth, validatePost, createPost);

// @route   GET /api/posts/hashtag/:tag
// @desc    Get posts by hashtag
// @access  Public
router.get('/hashtag/:tag', getPostsByHashtag);

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public
router.get('/:id', getPost);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', protect, requireAuth, checkOwnership('Post'), validatePost, updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', protect, requireAuth, checkOwnership('Post'), deletePost);

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
// @access  Public
router.get('/:id/comments', getComments);

// @route   POST /api/posts/:id/comments
// @desc    Add comment to post
// @access  Private
router.post('/:id/comments', protect, requireAuth, addComment);

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', protect, requireAuth, likePost);

// @route   DELETE /api/posts/:id/like
// @desc    Unlike a post
// @access  Private
router.delete('/:id/like', protect, requireAuth, unlikePost);

// @route   POST /api/posts/:id/bookmark
// @desc    Bookmark a post
// @access  Private
router.post('/:id/bookmark', protect, requireAuth, bookmarkPost);

// @route   DELETE /api/posts/:id/bookmark
// @desc    Remove bookmark from a post
// @access  Private
router.delete('/:id/bookmark', protect, requireAuth, unbookmarkPost);

module.exports = router; 