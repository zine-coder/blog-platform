const express = require('express');
const router = express.Router();
const {
  getPersonalizedFeed,
  getChronologicalFeed,
  recordInteraction,
  followHashtag,
  unfollowHashtag,
  getFollowedHashtags,
  updateFeedPreferences
} = require('../../controllers/feedController');
const { protect } = require('../../middleware/auth');

// Feed routes
router.get('/', protect, getPersonalizedFeed);
router.get('/chronological', protect, getChronologicalFeed);
router.post('/interaction', protect, recordInteraction);

// Hashtag routes
router.get('/hashtags/following', protect, getFollowedHashtags);
router.post('/hashtags/:hashtag/follow', protect, followHashtag);
router.delete('/hashtags/:hashtag/follow', protect, unfollowHashtag);

// Preferences routes
router.put('/preferences', protect, updateFeedPreferences);

module.exports = router; 