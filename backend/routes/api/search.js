const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const UserInteraction = require('../../models/UserInteraction');
const mongoose = require('mongoose');

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search terms
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    // Get popular search terms from user interactions
    const popularSearches = await UserInteraction.aggregate([
      // Filter only search interactions
      { $match: { interactionType: 'search' } },
      // Group by search query
      { $group: { 
        _id: '$metadata.query', 
        count: { $sum: 1 } 
      }},
      // Filter out empty queries
      { $match: { _id: { $ne: null, $ne: '' } } },
      // Sort by count descending
      { $sort: { count: -1 } },
      // Limit to top 10
      { $limit: 10 },
      // Project to desired format
      { $project: { 
        query: '$_id', 
        count: 1,
        _id: 0
      }}
    ]);

    return res.json({ popularSearches });
  } catch (err) {
    console.error('Error fetching popular searches:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/search/filters
 * @desc    Get available filter options
 * @access  Public
 */
router.get('/filters', async (req, res) => {
  try {
    // Get popular authors
    const popularAuthors = await Post.aggregate([
      { $group: { 
        _id: '$author', 
        username: { $first: '$authorUsername' },
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { 
        _id: 1, 
        username: 1,
        count: 1
      }}
    ]);

    // Get date ranges with post counts
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    const yearStart = new Date(now);
    yearStart.setFullYear(now.getFullYear() - 1);

    const dateRanges = [
      { 
        id: 'today',
        label: 'Today',
        count: await Post.countDocuments({ createdAt: { $gte: todayStart } })
      },
      { 
        id: 'this-week',
        label: 'This Week',
        count: await Post.countDocuments({ createdAt: { $gte: weekStart } })
      },
      { 
        id: 'this-month',
        label: 'This Month',
        count: await Post.countDocuments({ createdAt: { $gte: monthStart } })
      },
      { 
        id: 'this-year',
        label: 'This Year',
        count: await Post.countDocuments({ createdAt: { $gte: yearStart } })
      }
    ];

    // Get sort options with descriptions
    const sortOptions = [
      { id: 'recent', label: 'Most Recent', description: 'Newest posts first' },
      { id: 'popular', label: 'Most Popular', description: 'Posts with most likes' },
      { id: 'comments', label: 'Most Comments', description: 'Posts with most engagement' },
      { id: 'relevant', label: 'Most Relevant', description: 'Best matches for your search' }
    ];

    return res.json({ 
      filters: {
        authors: popularAuthors,
        dateRanges,
        sortOptions
      } 
    });
  } catch (err) {
    console.error('Error fetching filter options:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/search/hashtags/popular
 * @desc    Get popular hashtags
 * @access  Public
 */
router.get('/hashtags/popular', async (req, res) => {
  try {
    // Get popular hashtags from posts
    const popularHashtags = await Post.aggregate([
      // Unwind hashtags array to get individual hashtags
      { $unwind: '$hashtags' },
      // Group by hashtag
      { $group: { 
        _id: '$hashtags', 
        count: { $sum: 1 } 
      }},
      // Filter out empty hashtags
      { $match: { _id: { $ne: null, $ne: '' } } },
      // Sort by count descending
      { $sort: { count: -1 } },
      // Limit to top 20
      { $limit: 20 },
      // Project to desired format
      { $project: { 
        tag: '$_id', 
        count: 1,
        _id: 0
      }}
    ]);

    return res.json({ popularHashtags });
  } catch (err) {
    console.error('Error fetching popular hashtags:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/search/record
 * @desc    Record a search interaction
 * @access  Public
 */
router.post('/record', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Create a new user interaction for the search
    const interaction = new UserInteraction({
      interactionType: 'search',
      user: req.user ? req.user.id : null,
      metadata: {
        query: query.trim(),
        timestamp: new Date()
      }
    });
    
    await interaction.save();
    
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error recording search:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 