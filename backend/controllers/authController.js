const User = require('../models/User');

// Helper function to generate username suggestions
const generateUsernameSuggestions = async (username) => {
  const suggestions = [];
  const currentYear = new Date().getFullYear();
  
  // Try with a number suffix
  const randomNum = Math.floor(Math.random() * 100);
  suggestions.push(`${username}${randomNum}`);
  
  // Try with underscore and suffix
  suggestions.push(`${username}_${Math.floor(Math.random() * 10000)}`);
  
  // Try with year
  suggestions.push(`${username}${currentYear}`);
  
  // Verify if suggestions are available
  const availableSuggestions = [];
  
  for (const suggestion of suggestions) {
    const exists = await User.findOne({ username: suggestion });
    if (!exists) {
      availableSuggestions.push(suggestion);
    }
  }
  
  // If we couldn't find available suggestions, generate more random ones
  if (availableSuggestions.length === 0) {
    for (let i = 0; i < 3; i++) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const newSuggestion = `${username}${randomSuffix}`;
      const exists = await User.findOne({ username: newSuggestion });
      if (!exists) {
        availableSuggestions.push(newSuggestion);
      }
    }
  }
  
  return availableSuggestions.slice(0, 3);
};

// @desc    Check if username is available
// @route   POST /api/auth/check-username
// @access  Public
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      // Generate suggestions
      const suggestions = await generateUsernameSuggestions(username);
      
      return res.status(200).json({
        success: false,
        available: false,
        message: 'Username already taken',
        suggestions
      });
    }
    
    res.status(200).json({
      success: true,
      available: true,
      message: 'Username is available'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if username already exists
    let userWithUsername = await User.findOne({ username });
    if (userWithUsername) {
      // Generate username suggestions
      const suggestions = await generateUsernameSuggestions(username);
      
      return res.status(400).json({
        success: false,
        error: 'Username already taken',
        field: 'username',
        suggestions
      });
    }

    // Check if email already exists
    let userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use. Please use a different one.',
        field: 'email'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: '',
        bannerImage: '',
        bookmarks: [],
        followersCount: 0,
        followingCount: 0,
        articlesCount: 0
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Count user's posts
    const articlesCount = await require('../models/Post').countDocuments({ author: user._id });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage || '',
        bannerImage: user.bannerImage || '',
        createdAt: user.createdAt,
        bookmarks: user.bookmarks || [],
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
        articlesCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/user
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user.id);
    
    // Count user's posts
    const articlesCount = await require('../models/Post').countDocuments({ author: user._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage || '',
        bannerImage: user.bannerImage || '',
        createdAt: user.createdAt,
        bookmarks: user.bookmarks || [],
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
        articlesCount
      }
    });
  } catch (err) {
    next(err);
  }
}; 