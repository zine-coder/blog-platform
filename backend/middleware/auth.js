const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Extract token from request
const getTokenFromRequest = (req) => {
  let token;
  
  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  } else if (req.headers['x-auth-token']) {
    // Set token from custom header
    token = req.headers['x-auth-token'];
  }
  
  return token;
};

// Verify token and get user
const verifyTokenAndGetUser = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    return { user, error: null };
  } catch (err) {
    return { user: null, error: err };
  }
};

// Protect routes - requires authentication
exports.protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  // Check if token exists
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }

  try {
    // Verify token
    const { user, error } = await verifyTokenAndGetUser(token);
    
    if (error || !user) {
      console.error('Authentication error:', error?.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please log in again.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please log in again.'
    });
  }
};

// Optional authentication - allows requests with or without authentication
exports.optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  // If no token, continue without authentication
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const { user, error } = await verifyTokenAndGetUser(token);
    
    // If token is valid, attach user to request
    if (user && !error) {
      req.user = user;
    }
    
    // Continue regardless of authentication result
    next();
  } catch (err) {
    // Continue without authentication in case of error
    console.error('Optional auth error:', err.message);
    next();
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