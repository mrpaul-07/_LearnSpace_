// ============================================================
// LearnSpace - Recommendations Controller
// Suggests courses to a logged-in student based on:
//   1. Same category as their enrolled courses
//   2. Popular courses (most enrollments)
//   3. Newest published courses
// Falls back to popular courses for new / anonymous users.
// ============================================================
const { Course, Enrollment } = require('../models');
const logger = require('../utils/logger');

// GET /api/courses/recommendations
const getRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const userId = req.user?.id;

    let enrolledCourseIds = [];
    let preferredCategoryIds = [];

    if (userId) {
      const enrollments = await Enrollment.find({ student_id: userId })
        .populate('course_id', 'category_id')
        .lean();

      enrolledCourseIds = enrollments
        .map(e => e.course_id?._id)
        .filter(Boolean);

      preferredCategoryIds = [...new Set(
        enrollments
          .map(e => e.course_id?.category_id?.toString())
          .filter(Boolean)
      )];
    }

    // Strategy 1 — same category, not yet enrolled
    let recommendations = [];
    if (preferredCategoryIds.length > 0) {
      recommendations = await Course.find({
        status: 'published',
        category_id: { $in: preferredCategoryIds },
        _id: { $nin: enrolledCourseIds }
      })
        .populate('instructor_id', 'name avatar')
        .populate('category_id', 'name')
        .sort({ total_enrollments: -1, avg_rating: -1 })
        .limit(limit)
        .lean();
    }

    // Strategy 2 — fall back to popular courses if not enough yet
    if (recommendations.length < limit) {
      const need = limit - recommendations.length;
      const alreadyIn = recommendations.map(r => r._id);
      const popular = await Course.find({
        status: 'published',
        _id: { $nin: [...enrolledCourseIds, ...alreadyIn] }
      })
        .populate('instructor_id', 'name avatar')
        .populate('category_id', 'name')
        .sort({ total_enrollments: -1 })
        .limit(need)
        .lean();
      recommendations = [...recommendations, ...popular];
    }

    res.json({
      success: true,
      data: {
        recommendations,
        based_on: preferredCategoryIds.length > 0 ? 'enrolled_categories' : 'popularity'
      }
    });
  } catch (error) {
    logger.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations.' });
  }
};

module.exports = { getRecommendations };
