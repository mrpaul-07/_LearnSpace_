const express = require('express');
const router = express.Router();
const { Enrollment, Course, User } = require('../models');
const { protect, authorize, verifiedInstructor } = require('../middleware/auth.middleware');

// GET /api/enrollments/my
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student_id: req.user.id })
      .populate({
        path: 'course_id',
        select: 'id title thumbnail instructor_id total_lessons',
        populate: { path: 'instructor_id', select: 'name' }
      })
      .sort({ enrolled_at: -1 });
    res.json({ success: true, data: { enrollments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments.' });
  }
});

// GET /api/enrollments/course/:courseId
router.get('/course/:courseId', protect, verifiedInstructor, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course_id: req.params.courseId })
      .populate('student_id', 'id name email avatar')
      .sort({ enrolled_at: -1 });
    res.json({ success: true, data: { enrollments, total: enrollments.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments.' });
  }
});

module.exports = router;
