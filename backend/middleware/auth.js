const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Auth headers:', req.headers.authorization);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header:', token ? 'Yes' : 'No');
    if (token) {
      console.log('Token length:', token.length);
    }
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
    console.log('Token found in cookies:', token ? 'Yes' : 'No');
  } else if (req.headers['x-auth-token']) {
    // Set token from custom header
    token = req.headers['x-auth-token'];
    console.log('Token found in x-auth-token header:', token ? 'Yes' : 'No');
  }

  // Check if token exists
  if (!token) {
    console.log('No token found in request');
    return next(); // Allow request to continue without authentication
  }

  try {
    // Verify token
    console.log('Attempting to verify token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully, user ID:', decoded.id);

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');
    console.log('User attached to request:', req.user ? 'Yes' : 'No');
    if (req.user) {
      console.log('User ID:', req.user._id);
    } else {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User not found. Please log in again.'
      });
    }

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    console.error('Error name:', err.name);
    console.error('Error stack:', err.stack);
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please log in again.'
    });
  }
};

// Require authentication
exports.requireAuth = (req, res, next) => {
  console.log('requireAuth middleware called, user:', req.user ? 'Present' : 'Not present');
  
  if (!req.user) {
    console.log('Authentication required but no user found in request');
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  
  console.log('User authenticated successfully:', req.user.username);
  next();
};

// Check ownership
exports.checkOwnership = (modelName) => async (req, res, next) => {
  try {
    console.log(`Checking ownership for ${modelName} with ID: ${req.params.id}`);
    
    // Import the model dynamically
    const Model = require(`../models/${modelName}`);
    
    if (!Model) {
      console.error(`Model ${modelName} not found`);
      return res.status(500).json({
        success: false,
        error: `Internal server error: Model ${modelName} not found`
      });
    }
    
    const resource = await Model.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: `${modelName} not found`
      });
    }

    // Check if user is owner
    if (resource.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: `Not authorized to update this ${modelName.toLowerCase()}`
      });
    }

    req.resource = resource;
    next();
  } catch (err) {
    console.error(`Error in checkOwnership middleware:`, err);
    next(err);
  }
}; 