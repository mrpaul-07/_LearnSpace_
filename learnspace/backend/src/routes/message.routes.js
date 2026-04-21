const express = require('express');
const router = express.Router();
const { sendMessage, listConversations, getThread, getUnreadCount } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // all endpoints require login

router.get('/conversations',  listConversations);
router.get('/unread-count',   getUnreadCount);
router.get('/thread/:userId', getThread);
router.post('/',              sendMessage);

module.exports = router;
