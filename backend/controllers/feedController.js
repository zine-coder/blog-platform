const Post = require('../models/Post');
const User = require('../models/User');
const UserInteraction = require('../models/UserInteraction');
const HashtagFollow = require('../models/HashtagFollow');
const mongoose = require('mongoose');

// Constants for scoring algorithm
const WEIGHTS = {
  // Content relevance weights
  FOLLOWED_AUTHOR: 10,
  FOLLOWED_HASHTAG: 8,
  
  // Interaction weights
  VIEW: 1,
  LIKE: 3,
  COMMENT: 4,
  BOOKMARK: 5,
  SHARE: 6,
  
  // Popularity weights
  LIKES_COUNT: 0.5,
  COMMENTS_COUNT: 0.7,
  BOOKMARKS_COUNT: 0.8,
  
  // Recency decay factor (posts lose relevance over time)
  TIME_DECAY_FACTOR: 0.1
};

// @desc    Get personalized feed for current user
// @route   GET /api/feed
// @access  Private
exports.getPersonalizedFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get user preferences
    const user = await User.findById(userId);
    
    // If user has disabled personalization, return chronological feed
    if (user.preferences && user.preferences.feedPersonalization === false) {
      return getChronologicalFeed(req, res, next);
    }
    
    // 1. Gather user data for personalization
    const [
      followedAuthors,
      followedHashtags,
      userInteractions
    ] = await Promise.all([
      // Get authors the user follows
      User.findById(userId).select('following').then(u => u.following),
      
      // Get hashtags the user follows
      HashtagFollow.find({ user: userId }).select('hashtag').then(tags => tags.map(t => t.hashtag)),
      
      // Get user's recent interactions (last 30 days)
      UserInteraction.find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);
    
    // 2. Calculate user interests based on interactions
    const interactionsByHashtag = {};
    const interactionsByAuthor = {};
    
    userInteractions.forEach(interaction => {
      // Track hashtag interactions
      if (interaction.hashtag) {
        if (!interactionsByHashtag[interaction.hashtag]) {
          interactionsByHashtag[interaction.hashtag] = 0;
        }
        interactionsByHashtag[interaction.hashtag] += interaction.weight;
      }
      
      // Track author interactions
      if (interaction.author) {
        const authorId = interaction.author.toString();
        if (!interactionsByAuthor[authorId]) {
          interactionsByAuthor[authorId] = 0;
        }
        interactionsByAuthor[authorId] += interaction.weight;
      }
    });
    
    // 3. Get candidate posts (recent posts from the last 7 days)
    // We'll limit initial candidates to improve performance
    const recentPosts = await Post.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('author', 'username profileImage')
    .sort({ createdAt: -1 })
    .limit(100); // Limit candidate pool for performance
    
    // 4. Score and rank posts
    const scoredPosts = recentPosts.map(post => {
      let score = 0;
      const postObj = post.toObject();
      
      // Author relevance
      if (followedAuthors.some(id => id.toString() === post.author._id.toString())) {
        score += WEIGHTS.FOLLOWED_AUTHOR;
      }
      
      // Author interaction score
      const authorId = post.author._id.toString();
      if (interactionsByAuthor[authorId]) {
        score += interactionsByAuthor[authorId];
      }
      
      // Hashtag relevance
      if (post.hashtags && post.hashtags.length > 0) {
        post.hashtags.forEach(tag => {
          // Score for followed hashtags
          if (followedHashtags.includes(tag)) {
            score += WEIGHTS.FOLLOWED_HASHTAG;
          }
          
          // Score for hashtag interactions
          if (interactionsByHashtag[tag]) {
            score += interactionsByHashtag[tag];
          }
        });
      }
      
      // Content popularity
      const likesCount = post.likedBy ? post.likedBy.length : 0;
      score += likesCount * WEIGHTS.LIKES_COUNT;
      
      // Time decay (newer posts score higher)
      const hoursAge = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const timeDecay = Math.exp(-WEIGHTS.TIME_DECAY_FACTOR * hoursAge);
      score *= timeDecay;
      
      // Add score to post object
      postObj._score = score;
      return postObj;
    });
    
    // 5. Sort by score (descending)
    scoredPosts.sort((a, b) => b._score - a._score);
    
    // 6. Paginate results
    const paginatedPosts = scoredPosts.slice(startIndex, startIndex + limit);
    
    // 7. Get total count for pagination
    const total = scoredPosts.length;
    const pages = Math.ceil(total / limit);
    
    // 8. Return personalized feed
    res.status(200).json({
      success: true,
      count: paginatedPosts.length,
      pages,
      total,
      posts: paginatedPosts
    });
    
  } catch (err) {
    next(err);
  }
};

// @desc    Get chronological feed (fallback if personalization is disabled)
// @route   GET /api/feed/chronological
// @access  Private
exports.getChronologicalFeed = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get recent posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Post.countDocuments();
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      total,
      posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record user interaction with content
// @route   POST /api/feed/interaction
// @access  Private
exports.recordInteraction = async (req, res, next) => {
  try {
    const { interactionType, postId, authorId, hashtag } = req.body;
    
    // Validate interaction type
    const validInteractionTypes = ['view', 'like', 'comment', 'bookmark', 'share', 'follow_author', 'follow_hashtag'];
    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interaction type'
      });
    }
    
    // Set weight based on interaction type
    let weight = 1.0;
    switch (interactionType) {
      case 'view':
        weight = WEIGHTS.VIEW;
        break;
      case 'like':
        weight = WEIGHTS.LIKE;
        break;
      case 'comment':
        weight = WEIGHTS.COMMENT;
        break;
      case 'bookmark':
        weight = WEIGHTS.BOOKMARK;
        break;
      case 'share':
        weight = WEIGHTS.SHARE;
        break;
      case 'follow_author':
        weight = WEIGHTS.FOLLOWED_AUTHOR;
        break;
      case 'follow_hashtag':
        weight = WEIGHTS.FOLLOWED_HASHTAG;
        break;
    }
    
    // Create interaction record
    const interaction = await UserInteraction.create({
      user: req.user.id,
      interactionType,
      post: postId || null,
      author: authorId || null,
      hashtag: hashtag || null,
      weight
    });
    
    res.status(201).json({
      success: true,
      interaction
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Follow a hashtag
// @route   POST /api/feed/hashtags/:hashtag/follow
// @access  Private
exports.followHashtag = async (req, res, next) => {
  try {
    const { hashtag } = req.params;
    
    // Check if already following
    const existingFollow = await HashtagFollow.findOne({
      user: req.user.id,
      hashtag
    });
    
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'Already following this hashtag'
      });
    }
    
    // Create hashtag follow record
    await HashtagFollow.create({
      user: req.user.id,
      hashtag
    });
    
    // Add to user's followingHashtags array
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { followingHashtags: hashtag } }
    );
    
    // Record interaction
    await UserInteraction.create({
      user: req.user.id,
      interactionType: 'follow_hashtag',
      hashtag,
      weight: WEIGHTS.FOLLOWED_HASHTAG
    });
    
    res.status(200).json({
      success: true,
      message: `Now following hashtag: ${hashtag}`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unfollow a hashtag
// @route   DELETE /api/feed/hashtags/:hashtag/follow
// @access  Private
exports.unfollowHashtag = async (req, res, next) => {
  try {
    const { hashtag } = req.params;
    
    // Delete hashtag follow record
    const result = await HashtagFollow.findOneAndDelete({
      user: req.user.id,
      hashtag
    });
    
    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Not following this hashtag'
      });
    }
    
    // Remove from user's followingHashtags array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { followingHashtags: hashtag } }
    );
    
    res.status(200).json({
      success: true,
      message: `Unfollowed hashtag: ${hashtag}`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get followed hashtags for current user
// @route   GET /api/feed/hashtags/following
// @access  Private
exports.getFollowedHashtags = async (req, res, next) => {
  try {
    const followedHashtags = await HashtagFollow.find({
      user: req.user.id
    }).select('hashtag createdAt');
    
    res.status(200).json({
      success: true,
      count: followedHashtags.length,
      hashtags: followedHashtags
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update feed preferences
// @route   PUT /api/feed/preferences
// @access  Private
exports.updateFeedPreferences = async (req, res, next) => {
  try {
    const { feedPersonalization, contentLanguages } = req.body;
    
    const updateData = {};
    
    if (typeof feedPersonalization === 'boolean') {
      updateData['preferences.feedPersonalization'] = feedPersonalization;
    }
    
    if (contentLanguages && Array.isArray(contentLanguages)) {
      updateData['preferences.contentLanguages'] = contentLanguages;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      preferences: user.preferences
    });
  } catch (err) {
    next(err);
  }
}; 