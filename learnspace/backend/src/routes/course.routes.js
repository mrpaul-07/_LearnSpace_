const express = require('express');
const router = express.Router();
const { getCourses, getCourse, createCourse, updateCourse, submitForReview, deleteCourse, getInstructorCourses, getFeaturedCourses } = require('../controllers/course.controller');
const { getRecommendations } = require('../controllers/recommendations.controller');
const { protect, authorize, verifiedInstructor, optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', optionalAuth, getCourses);
router.get('/featured', getFeaturedCourses);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', optionalAuth, getCourse);
router.post('/', protect, verifiedInstructor, upload.single('thumbnail'), createCourse);
router.put('/:id', protect, verifiedInstructor, upload.single('thumbnail'), updateCourse);
router.post('/:id/submit', protect, verifiedInstructor, submitForReview);
router.delete('/:id', protect, verifiedInstructor, deleteCourse);

module.exports = router;
