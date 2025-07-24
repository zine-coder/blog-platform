const express = require('express');
const router = express.Router();
const { 
  uploadImage, 
  uploadMiddleware, 
  uploadMultipleImages, 
  uploadMultipleMiddleware 
} = require('../../controllers/uploadController');
const { protect, requireAuth } = require('../../middleware/auth');

// @route   POST /api/upload
// @desc    Upload single image to Cloudinary
// @access  Private
router.post('/', protect, requireAuth, uploadMiddleware, uploadImage);

// @route   POST /api/upload/multiple
// @desc    Upload multiple images to Cloudinary
// @access  Private
router.post('/multiple', protect, requireAuth, uploadMultipleMiddleware, uploadMultipleImages);

module.exports = router; 