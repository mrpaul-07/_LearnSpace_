const express = require('express');
const router = express.Router();
const { getQuiz, submitQuiz, createQuiz } = require('../controllers/lesson.controller');
const { protect, authorize, verifiedInstructor } = require('../middleware/auth.middleware');

router.get('/:id', protect, getQuiz);
router.post('/', protect, verifiedInstructor, createQuiz);
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

module.exports = router;
