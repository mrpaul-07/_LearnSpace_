const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getInstructorAnalytics } = require('../controllers/lesson.controller');

router.get('/instructor', protect, authorize('instructor'), getInstructorAnalytics);

router.get('/platform', protect, authorize('admin'), async (req, res) => {
  try {
    const { User, Course, Enrollment, Payment } = require('../models');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newUsers, newCourses, newEnrollments, revenueAgg] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Course.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Enrollment.countDocuments({ enrolled_at: { $gte: thirtyDaysAgo } }),
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    res.json({ success: true, data: { newUsers, newCourses, newEnrollments, revenue: revenueAgg[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

module.exports = router;
