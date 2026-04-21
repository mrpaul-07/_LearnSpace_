// ============================================================
// LearnSpace - Lesson Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { getLessons, createLesson, updateLesson, togglePublish, deleteLesson } = require('../controllers/lesson.controller');
const { protect, verifiedInstructor } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/course/:courseId', protect, getLessons);
router.post('/course/:courseId', protect, verifiedInstructor, upload.single('content'), createLesson);
router.put('/:id', protect, verifiedInstructor, upload.single('content'), updateLesson);
router.patch('/:id/toggle-publish', protect, verifiedInstructor, togglePublish);
router.delete('/:id', protect, verifiedInstructor, deleteLesson);

module.exports = router;
