const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUser,
  checkUsername 
} = require('../../controllers/authController');
const { protect, requireAuth } = require('../../middleware/auth');
const { validateRegister, validateLogin } = require('../../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
// @desc    Login user / get token
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/check-username
// @desc    Check username availability
// @access  Public
router.post('/check-username', checkUsername);

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', protect, requireAuth, getUser);

module.exports = router; 