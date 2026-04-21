const express = require('express');
const router = express.Router();
const { markLessonComplete, getCourseProgress, updateWatchPosition } = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/lesson/:lessonId', protect, markLessonComplete);
router.get('/course/:courseId', protect, getCourseProgress);
router.patch('/lesson/:lessonId/position', protect, updateWatchPosition);

module.exports = router;
