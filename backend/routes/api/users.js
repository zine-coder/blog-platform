const express = require('express');
const router = express.Router();
const { 
  getUserByUsername, 
  updateProfile, 
  updateEmail,
  updatePassword,
  deleteAccount,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  updateProfileImage,
  updateBannerImage
} = require('../../controllers/userController');
const { 
  getUserPosts,
  getLikedPosts,
  getBookmarkedPosts
} = require('../../controllers/postController');
const { protect, requireAuth } = require('../../middleware/auth');

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', searchUsers);

// @route   GET /api/users/liked-posts
// @desc    Get user's liked posts
// @access  Private
router.get('/liked-posts', protect, requireAuth, getLikedPosts);

// @route   GET /api/users/bookmarks
// @desc    Get user's bookmarked posts
// @access  Private
router.get('/bookmarks', protect, requireAuth, getBookmarkedPosts);

// @route   GET /api/users/:username
// @desc    Get user by username
// @access  Public
router.get('/:username', protect, getUserByUsername);

// @route   GET /api/users/:id/posts
// @desc    Get posts by user
// @access  Public
router.get('/:id/posts', getUserPosts);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, requireAuth, updateProfile);

// @route   PUT /api/users/profile-image
// @desc    Update user profile image
// @access  Private
router.put('/profile-image', protect, requireAuth, updateProfileImage);

// @route   PUT /api/users/banner-image
// @desc    Update user banner image
// @access  Private
router.put('/banner-image', protect, requireAuth, updateBannerImage);

// @route   PUT /api/users/email
// @desc    Update user email
// @access  Private
router.put('/email', protect, requireAuth, updateEmail);

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', protect, requireAuth, updatePassword);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, requireAuth, deleteAccount);

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, requireAuth, followUser);

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/follow', protect, requireAuth, unfollowUser);

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', getFollowers);

// @route   GET /api/users/:id/following
// @desc    Get users followed by a user
// @access  Public
router.get('/:id/following', getFollowing);

module.exports = router; 