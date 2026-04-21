// ============================================================
// LearnSpace - Review Controller
// ============================================================
const mongoose = require('mongoose');
const { Review, Course, Enrollment } = require('../models');
const logger = require('../utils/logger');

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

// Helper: recompute avg_rating and total_reviews on Course
const recomputeCourseRating = async (courseId) => {
  const agg = await Review.aggregate([
    { $match: { course_id: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Course.findByIdAndUpdate(courseId, {
    avg_rating: parseFloat(avg.toFixed(2)),
    total_reviews: count
  });
};

// POST /api/reviews/:courseId
// Student leaves/updates their review on a course they are enrolled in
const createOrUpdateReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const student_id = req.user.id;

    if (!isValidId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course id.' });
    }
    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5.' });
    }

    // Must be enrolled to review
    const enrollment = await Enrollment.findOne({ student_id, course_id: courseId });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can review this course.' });
    }

    const review = await Review.findOneAndUpdate(
      { student_id, course_id: courseId },
      { rating: parsedRating, comment: (comment || '').trim() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recomputeCourseRating(courseId);

    res.json({ success: true, message: 'Review saved.', data: { review } });
  } catch (error) {
    logger.error('Create/update review error:', error);
    res.status(500).json({ success: false, message: 'Failed to save review.' });
  }
};

// GET /api/reviews/course/:courseId
// Public - anyone can see a course's reviews
const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course id.' });
    }

    const reviews = await Review.find({ course_id: courseId })
      .populate('student_id', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    logger.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

// GET /api/reviews/my/:courseId
// Student checks if they've already reviewed this course
const getMyReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const review = await Review.findOne({ student_id: req.user.id, course_id: courseId });
    res.json({ success: true, data: { review: review || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch review.' });
  }
};

// DELETE /api/reviews/:courseId
// Student deletes their own review
const deleteReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const review = await Review.findOneAndDelete({ student_id: req.user.id, course_id: courseId });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    await recomputeCourseRating(courseId);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};

module.exports = { createOrUpdateReview, getCourseReviews, getMyReview, deleteReview };
