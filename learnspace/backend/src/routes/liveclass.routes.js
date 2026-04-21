const express = require('express');
const router = express.Router();
const { createLiveClass, getCourseClasses, updateLiveClass, deleteLiveClass } = require('../controllers/liveclass.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware');

router.get('/course/:courseId',  protect, getCourseClasses);
router.post('/',                 protect, authorize('instructor', 'admin'), createLiveClass);
router.patch('/:id',             protect, authorize('instructor', 'admin'), updateLiveClass);
router.delete('/:id',            protect, authorize('instructor', 'admin'), deleteLiveClass);

module.exports = router;
