const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbot.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// Anyone can chat; logged-in users get personalized replies
router.post('/message', optionalAuth, handleMessage);

module.exports = router;
