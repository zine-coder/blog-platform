const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Get user by username
// @route   GET /api/users/:username
// @access  Public
exports.getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Count user's posts
    const articlesCount = await Post.countDocuments({ author: user._id });
    
    // Check if the current user is following this user
    let isFollowing = false;
    if (req.user) {
      // Find the current user with populated following list for accurate check
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.following) {
        // Convert ObjectIds to strings for accurate comparison
        isFollowing = currentUser.following.some(id => id.toString() === user._id.toString());
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage || '',
        bannerImage: user.bannerImage || '',
        createdAt: user.createdAt,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        articlesCount,
        isFollowing
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      bio: req.body.bio
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

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
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user email
// @route   PUT /api/users/email
// @access  Private
exports.updateEmail = async (req, res, next) => {
  try {
    const { email, currentPassword } = req.body;

    // Validate inputs
    if (!email || !currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and current password'
      });
    }

    // Check if email is valid
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email'
      });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already in use'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update email
    user.email = email;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt,
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both current and new password'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    // Find all posts by the user
    const posts = await Post.find({ author: req.user.id });

    // Delete all comments on user's posts
    for (const post of posts) {
      await Comment.deleteMany({ postId: post._id });
    }

    // Delete all posts by the user
    await Post.deleteMany({ author: req.user.id });

    // Delete all comments by the user on other posts
    await Comment.deleteMany({ author: req.user.id });
    
    // Remove user from followers/following lists
    await User.updateMany(
      { followers: req.user.id },
      { $pull: { followers: req.user.id } }
    );
    
    await User.updateMany(
      { following: req.user.id },
      { $pull: { following: req.user.id } }
    );
    
    // Delete all notifications related to the user
    await Notification.deleteMany({ 
      $or: [
        { recipient: req.user.id },
        { sender: req.user.id }
      ]
    });

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Can't follow yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot follow yourself'
      });
    }
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    
    // Check if already following (compare as strings for accurate comparison)
    const isAlreadyFollowing = currentUser.following.some(id => id.toString() === req.params.id);
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        error: 'You are already following this user'
      });
    }
    
    // Add to following list
    currentUser.following.push(req.params.id);
    await currentUser.save();
    
    // Add to followers list
    userToFollow.followers.push(req.user.id);
    await userToFollow.save();
    
    // Create notification
    await Notification.create({
      recipient: req.params.id,
      sender: req.user.id,
      type: 'new_follower'
    });
    
    res.status(200).json({
      success: true,
      message: 'User followed successfully',
      isFollowing: true,
      followersCount: userToFollow.followers.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    // Check if user exists
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    
    // Check if actually following (compare as strings for accurate comparison)
    const isFollowing = currentUser.following.some(id => id.toString() === req.params.id);
    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        error: 'You are not following this user'
      });
    }
    
    // Remove from following list
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    await currentUser.save();
    
    // Remove from followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );
    await userToUnfollow.save();
    
    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
      isFollowing: false,
      followersCount: userToUnfollow.followers.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res, next) => {
  try {
    // Trouver l'utilisateur et peupler le champ followers
    const user = await User.findById(req.params.id).populate('followers', 'username bio profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Formater la réponse pour correspondre à ce qu'attend le frontend
    const formattedFollowers = user.followers.map(follower => ({
      id: follower._id,
      username: follower.username,
      bio: follower.bio || '',
      profileImage: follower.profileImage || ''
    }));
    
    res.status(200).json({
      success: true,
      users: formattedFollowers,
      pages: 1,
      total: formattedFollowers.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users followed by a user
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res, next) => {
  try {
    // Trouver l'utilisateur et peupler le champ following
    const user = await User.findById(req.params.id).populate('following', 'username bio profileImage');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Formater la réponse pour correspondre à ce qu'attend le frontend
    const formattedFollowing = user.following.map(following => ({
      id: following._id,
      username: following.username,
      bio: following.bio || '',
      profileImage: following.profileImage || ''
    }));
    
    res.status(200).json({
      success: true,
      users: formattedFollowing,
      pages: 1,
      total: formattedFollowing.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query'
      });
    }
    
    // Search by username
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username bio profileImage')
    .skip(startIndex)
    .limit(limit);
    
    // Get total count
    const total = await User.countDocuments({ username: { $regex: query, $options: 'i' } });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get article counts for each user
    const usersWithArticleCounts = await Promise.all(users.map(async (user) => {
      const articlesCount = await require('../models/Post').countDocuments({ author: user._id });
      const userObj = user.toObject();
      userObj.articlesCount = articlesCount;
      return userObj;
    }));
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages,
      users: usersWithArticleCounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile-image
// @access  Private
exports.updateProfileImage = async (req, res, next) => {
  try {
    // Allow empty string to remove the profile image
    // req.body.imageUrl can be an empty string or a valid URL
    const profileImage = req.body.imageUrl === '' ? null : req.body.imageUrl;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage },
      { new: true, runValidators: true }
    );

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
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update banner image
// @route   PUT /api/users/banner-image
// @access  Private
exports.updateBannerImage = async (req, res, next) => {
  try {
    // Allow empty string to remove the banner image
    // req.body.imageUrl can be an empty string or a valid URL
    const bannerImage = req.body.imageUrl === '' ? null : req.body.imageUrl;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bannerImage },
      { new: true, runValidators: true }
    );

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
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (err) {
    next(err);
  }
}; 