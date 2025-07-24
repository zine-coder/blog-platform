const express = require('express');
const router = express.Router();

// Mount API routes
router.use('/api/auth', require('./api/auth'));
router.use('/api/posts', require('./api/posts'));
router.use('/api/comments', require('./api/comments'));
router.use('/api/users', require('./api/users'));
router.use('/api/notifications', require('./api/notifications'));

module.exports = router; 