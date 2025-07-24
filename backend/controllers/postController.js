const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Search functionality
    const searchQuery = {};
    if (req.query.search) {
      // Check if search is a hashtag query
      if (req.query.search.startsWith('#')) {
        const tag = req.query.search.substring(1); // Remove the # symbol
        searchQuery.hashtags = tag;
      } else {
        searchQuery.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { body: { $regex: req.query.search, $options: 'i' } }
        ];
      }
    }
    
    // Execute query
    const posts = await Post.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Post.countDocuments(searchQuery);
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      const postObj = post.toObject();
      postObj.commentCount = commentCount;
      return postObj;
    }));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      posts: postsWithComments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get posts by hashtag
// @route   GET /api/posts/hashtag/:tag
// @access  Public
exports.getPostsByHashtag = async (req, res, next) => {
  try {
    // Get hashtag from params
    const tag = req.params.tag;
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Find posts with the hashtag
    const posts = await Post.find({ hashtags: tag })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Post.countDocuments({ hashtags: tag });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      const postObj = post.toObject();
      postObj.commentCount = commentCount;
      return postObj;
    }));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      tag,
      posts: postsWithComments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Convert to plain object to add custom properties
    const postObj = post.toObject();
    
    // Get likes count
    postObj.likes = post.likedBy ? post.likedBy.length : 0;
    
    // Check if the current user has liked the post
    postObj.isLiked = false;
    // Check if the current user has bookmarked the post
    postObj.isBookmarked = false;
    
    if (req.user) {
      // Convert ObjectIds to strings for comparison
      const userIdStr = req.user.id;
      postObj.isLiked = post.likedBy.some(id => id.toString() === userIdStr);
      
      // Check if post is bookmarked by the user
      const user = await User.findById(userIdStr);
      if (user && user.bookmarks) {
        postObj.isBookmarked = user.bookmarks.some(id => id.toString() === post._id.toString());
      }
    }

    res.status(200).json({
      success: true,
      post: postObj
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    req.body.author = req.user.id;
    
    // Process hashtags if provided
    if (req.body.hashtags) {
      // Ensure hashtags are properly formatted (remove # if present)
      req.body.hashtags = req.body.hashtags.map(tag => 
        tag.startsWith('#') ? tag.substring(1) : tag
      );
    }

    // Handle new content structure if provided
    if (req.body.content && Array.isArray(req.body.content)) {
      // Validate content structure
      const validContent = req.body.content.filter(item => 
        item && typeof item.text === 'string' && item.text.trim() !== ''
      );
      
      if (validContent.length > 0) {
        req.body.content = validContent;
        
        // Generate body field for backward compatibility
        req.body.body = validContent.map(item => item.text).join('\n\n');
      }
    } else if (req.body.body && !req.body.content) {
      // Create content from body for new structure
      req.body.content = [{ text: req.body.body, image: null }];
    }

    const post = await Post.create(req.body);
    
    // Populate author for response
    const populatedPost = await Post.findById(post._id).populate('author', 'username profileImage');
    
    // Create notifications for followers
    const currentUser = await User.findById(req.user.id);
    
    // Create a notification for each follower
    if (currentUser.followers && currentUser.followers.length > 0) {
      const notifications = currentUser.followers.map(followerId => ({
        recipient: followerId,
        sender: req.user.id,
        type: 'new_post',
        post: post._id
      }));
      
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    console.log('Update post request received:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body));
    
    // Validate that the post ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID format'
      });
    }
    
    // Find the post by ID
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Make sure user is post owner
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }
    
    // Create update object with only the fields we want to update
    const updateData = {
      updatedAt: Date.now()
    };
    
    // Only add fields if they are provided and valid
    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }
    
    // Handle new content structure if provided
    if (req.body.content && Array.isArray(req.body.content)) {
      // Validate content structure
      const validContent = req.body.content.filter(item => 
        item && typeof item.text === 'string' && item.text.trim() !== ''
      );
      
      if (validContent.length > 0) {
        updateData.content = validContent;
        
        // Generate body field for backward compatibility
        updateData.body = validContent.map(item => item.text).join('\n\n');
      }
    } else if (req.body.body !== undefined) {
      updateData.body = req.body.body;
      
      // Create content from body for new structure if content isn't provided
      if (!req.body.content) {
        updateData.content = [{ text: req.body.body, image: null }];
      }
    }
    
    if (req.body.imageUrl !== undefined) {
      updateData.imageUrl = req.body.imageUrl;
    }
    
    // Process hashtags if provided
    if (Array.isArray(req.body.hashtags)) {
      // Ensure hashtags are properly formatted (remove # if present)
      updateData.hashtags = req.body.hashtags
        .filter(tag => tag && typeof tag === 'string')
        .map(tag => tag.startsWith('#') ? tag.substring(1) : tag);
    }
    
    console.log('Update data:', JSON.stringify(updateData));

    try {
      // Use findOneAndUpdate for better error handling
      post = await Post.findOneAndUpdate(
        { _id: req.params.id },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('author', 'username profileImage');

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found after update'
        });
      }

      res.status(200).json({
        success: true,
        post
      });
    } catch (updateErr) {
      console.error('Error during findOneAndUpdate:', updateErr);
      return res.status(500).json({
        success: false,
        error: `Update failed: ${updateErr.message}`
      });
    }
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({
      success: false,
      error: `Server error: ${err.message}`
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Make sure user is post owner
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: post._id });
    
    // Delete all notifications related to this post
    await Notification.deleteMany({ post: post._id });
    
    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get posts by user
// @route   GET /api/users/:id/posts
// @access  Public
exports.getUserPosts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Find posts by user
    const posts = await Post.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Post.countDocuments({ author: req.params.id });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      const postObj = post.toObject();
      postObj.commentCount = commentCount;
      return postObj;
    }));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      total,
      posts: postsWithComments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check if post has likedBy array
    if (!post.likedBy) {
      post.likedBy = [];
    }
    
    // Check if the post has already been liked by this user
    if (post.likedBy.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post already liked'
      });
    }
    
    // Add user id to likedBy array
    post.likedBy.push(req.user.id);
    await post.save();
    
    res.status(200).json({
      success: true,
      message: 'Post liked',
      likes: post.likedBy.length,
      isLiked: true
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Check if post has likedBy array
    if (!post.likedBy) {
      post.likedBy = [];
    }
    
    // Check if the post has been liked by this user
    if (!post.likedBy.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post has not been liked yet'
      });
    }
    
    // Remove user id from likedBy array
    post.likedBy = post.likedBy.filter(id => id.toString() !== req.user.id);
    await post.save();
    
    res.status(200).json({
      success: true,
      message: 'Post unliked',
      likes: post.likedBy.length,
      isLiked: false
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bookmark a post
// @route   POST /api/posts/:id/bookmark
// @access  Private
exports.bookmarkPost = async (req, res, next) => {
  try {
    // Check if post exists
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Find user and update bookmarks
    const user = await User.findById(req.user.id);
    
    // Check if user has bookmarks array
    if (!user.bookmarks) {
      user.bookmarks = [];
    }
    
    // Check if already bookmarked
    if (user.bookmarks.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post already bookmarked'
      });
    }
    
    // Add post to bookmarks
    user.bookmarks.push(req.params.id);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Post bookmarked'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove bookmark from a post
// @route   DELETE /api/posts/:id/bookmark
// @access  Private
exports.unbookmarkPost = async (req, res, next) => {
  try {
    // Check if post exists
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Find user and update bookmarks
    const user = await User.findById(req.user.id);
    
    // Check if user has bookmarks array
    if (!user.bookmarks) {
      user.bookmarks = [];
    }
    
    // Check if bookmarked
    if (!user.bookmarks.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post not bookmarked yet'
      });
    }
    
    // Remove post from bookmarks
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== req.params.id);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Bookmark removed'
    });
  } catch (err) {
    next(err);
  }
}; 

// @desc    Get user's liked posts
// @route   GET /api/users/liked-posts
// @access  Private
exports.getLikedPosts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Find posts liked by user
    const posts = await Post.find({ likedBy: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = await Post.countDocuments({ likedBy: req.user.id });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      const postObj = post.toObject();
      postObj.commentCount = commentCount;
      return postObj;
    }));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      posts: postsWithComments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's bookmarked posts
// @route   GET /api/users/bookmarks
// @access  Private
exports.getBookmarkedPosts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get user with bookmarks
    const user = await User.findById(req.user.id);
    
    if (!user || !user.bookmarks) {
      return res.status(200).json({
        success: true,
        count: 0,
        pages: 0,
        posts: []
      });
    }
    
    // Find bookmarked posts
    const posts = await Post.find({ _id: { $in: user.bookmarks } })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'username profileImage');
    
    // Get total count
    const total = user.bookmarks.length;
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    // Get comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      const postObj = post.toObject();
      postObj.commentCount = commentCount;
      return postObj;
    }));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      pages,
      posts: postsWithComments
    });
  } catch (err) {
    next(err);
  }
}; 