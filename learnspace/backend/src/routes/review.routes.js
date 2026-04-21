const express = require('express');
const router = express.Router();
const { createOrUpdateReview, getCourseReviews, getMyReview, deleteReview } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public
router.get('/course/:courseId', getCourseReviews);

// Student only
router.get('/my/:courseId',   protect, authorize('student'), getMyReview);
router.post('/:courseId',     protect, authorize('student'), createOrUpdateReview);
router.delete('/:courseId',   protect, authorize('student'), deleteReview);

module.exports = router;
