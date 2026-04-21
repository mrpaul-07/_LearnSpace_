// ============================================================
// LearnSpace - Lesson, Quiz & Analytics Controller (MongoDB)
// ============================================================
const mongoose = require('mongoose');
const {
  Lesson,
  Course,
  Quiz,
  QuizResult,
  Enrollment,
  InstructorEarning
} = require('../models');
const { uploadToCloud } = require('../services/upload.service');
const logger = require('../utils/logger');

const isValidObjectId = (value) => typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
const toBoolean = (value) => value === true || value === 'true';

const isCourseOwnerOrAdmin = async (courseId, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'instructor') return false;

  const course = await Course.findById(courseId).select('instructor_id');
  return Boolean(course) && String(course.instructor_id) === String(user.id);
};

// GET /api/lessons/course/:courseId
const getLessons = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    const course = await Course.findById(courseId).select('instructor_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const canSeeAllLessons = req.user?.role === 'admin'
      || (req.user?.role === 'instructor' && String(course.instructor_id) === String(req.user.id));

    const filter = { course_id: courseId };
    if (!canSeeAllLessons) {
      filter.is_published = true;
    }

    const lessons = await Lesson.find(filter).sort({ order_index: 1 });
    return res.json({ success: true, data: { lessons } });
  } catch (error) {
    logger.error('Get lessons error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch lessons.' });
  }
};

// POST /api/lessons/course/:courseId
const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title, title_bn, description, type, is_preview, order_index
    } = req.body;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Lesson title is required.' });
    }

    const canManageCourse = await isCourseOwnerOrAdmin(courseId, req.user);
    if (!canManageCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    let contentUrl = null;
    if (req.file) {
      contentUrl = await uploadToCloud(
        req.file,
        type === 'video' ? 'lesson-videos' : 'lesson-docs'
      );
    }

    const lastLesson = await Lesson.findOne({ course_id: courseId }).sort({ order_index: -1 });
    const nextOrder = (
      order_index !== undefined
      && order_index !== null
      && order_index !== ''
      && !Number.isNaN(parseInt(order_index, 10))
    )
      ? parseInt(order_index, 10)
      : (lastLesson ? lastLesson.order_index + 1 : 1);

    const lessonType = type || 'video';
    // Auto-publish if the lesson has uploadable content already attached, or
    // if it's a quiz/text type (which doesn't require an upload).
    const autoPublish = Boolean(contentUrl) || lessonType === 'quiz' || lessonType === 'text';

    const lesson = await Lesson.create({
      course_id: courseId,
      title: title.trim(),
      title_bn,
      description,
      type: lessonType,
      content_url: contentUrl,
      duration: 0,
      order_index: nextOrder,
      is_preview: toBoolean(is_preview),
      is_published: autoPublish
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { total_lessons: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Lesson added.',
      data: { lesson }
    });
  } catch (error) {
    logger.error('Create lesson error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create lesson.' });
  }
};

// PUT /api/lessons/:id
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID.' });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }

    const canManageCourse = await isCourseOwnerOrAdmin(String(lesson.course_id), req.user);
    if (!canManageCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updates = {};
    ['title', 'title_bn', 'description'].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.is_preview !== undefined) {
      updates.is_preview = toBoolean(req.body.is_preview);
    }

    if (
      req.body.order_index !== undefined
      && req.body.order_index !== null
      && req.body.order_index !== ''
      && !Number.isNaN(parseInt(req.body.order_index, 10))
    ) {
      updates.order_index = parseInt(req.body.order_index, 10);
    }

    if (req.file) {
      updates.content_url = await uploadToCloud(
        req.file,
        lesson.type === 'video' ? 'lesson-videos' : 'lesson-docs'
      );
      // Once content is uploaded, the lesson can safely be published
      if (lesson.is_published === false) {
        updates.is_published = true;
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(id, updates, { new: true });

    return res.json({
      success: true,
      message: 'Lesson updated.',
      data: { lesson: updatedLesson }
    });
  } catch (error) {
    logger.error('Update lesson error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update lesson.' });
  }
};

// PATCH /api/lessons/:id/toggle-publish
const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID.' });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }

    const canManageCourse = await isCourseOwnerOrAdmin(String(lesson.course_id), req.user);
    if (!canManageCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    lesson.is_published = !lesson.is_published;
    await lesson.save();

    return res.json({ success: true, data: { lesson } });
  } catch (error) {
    logger.error('Toggle lesson publish error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle lesson.' });
  }
};

// DELETE /api/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID.' });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found.' });
    }

    const canManageCourse = await isCourseOwnerOrAdmin(String(lesson.course_id), req.user);
    if (!canManageCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await lesson.deleteOne();
    await Course.findByIdAndUpdate(lesson.course_id, { $inc: { total_lessons: -1 } });

    return res.json({ success: true, message: 'Lesson deleted.' });
  } catch (error) {
    logger.error('Delete lesson error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete lesson.' });
  }
};

// GET /api/quizzes/:id
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    if (req.user?.role === 'student') {
      const sanitized = quiz.toJSON();
      sanitized.questions = sanitized.questions.map((question) => {
        const { correct_answer, explanation, ...rest } = question;
        if (rest.options) {
          rest.options = rest.options.map((option) => (
            typeof option === 'object' ? { text: option.text } : option
          ));
        }
        return rest;
      });
      return res.json({ success: true, data: { quiz: sanitized } });
    }

    return res.json({ success: true, data: { quiz } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quiz.' });
  }
};

// POST /api/quizzes/:id/submit
const submitQuiz = async (req, res) => {
  try {
    const { answers, time_taken } = req.body;
    const student_id = req.user.id;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const attemptCount = await QuizResult.countDocuments({ quiz_id: quiz._id, student_id });
    if (attemptCount >= quiz.max_attempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${quiz.max_attempts} attempts allowed.`
      });
    }

    let earnedPoints = 0;
    let totalPoints = 0;

    const gradedAnswers = quiz.questions.map((question) => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question._id];
      let isCorrect = false;

      if (question.question_type === 'short_answer') {
        isCorrect = userAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      } else {
        const correctText = typeof question.correct_answer === 'string'
          ? question.correct_answer
          : question.options?.find((option) => option.is_correct)?.text;
        isCorrect = userAnswer === correctText;
      }

      if (isCorrect) earnedPoints += question.points || 1;

      return {
        question_id: question._id,
        selected_answer: userAnswer,
        is_correct: isCorrect
      };
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= quiz.passing_score;

    const result = await QuizResult.create({
      quiz_id: quiz._id,
      student_id,
      score: parseFloat(score.toFixed(2)),
      total_points: totalPoints,
      earned_points: earnedPoints,
      passed,
      answers: gradedAnswers,
      attempt_number: attemptCount + 1,
      time_taken: time_taken || 0
    });

    return res.json({ success: true, data: { result } });
  } catch (error) {
    logger.error('Submit quiz error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit quiz.' });
  }
};

// POST /api/quizzes
const createQuiz = async (req, res) => {
  try {
    const {
      course_id,
      lesson_id,
      title,
      description,
      time_limit,
      passing_score,
      max_attempts,
      questions
    } = req.body;

    const quiz = await Quiz.create({
      course_id,
      lesson_id,
      title,
      description,
      time_limit,
      passing_score: passing_score || 60,
      max_attempts: max_attempts || 3,
      is_published: false,
      questions: questions?.map((question, index) => ({ ...question, order_index: index + 1 })) || []
    });

    return res.status(201).json({ success: true, data: { quiz } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create quiz.' });
  }
};

// GET /api/analytics/instructor
const getInstructorAnalytics = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    const instructorCourses = await Course.find({ instructor_id }).select('_id');
    const courseIds = instructorCourses.map((course) => course._id);

    const [totalEarningsAgg, totalEnrollments, earningsByMonth] = await Promise.all([
      InstructorEarning.aggregate([
        { $match: { instructor_id: mongoose.Types.ObjectId.createFromHexString(instructor_id) } },
        { $group: { _id: null, total: { $sum: '$net_earning' } } }
      ]),
      Enrollment.countDocuments({ course_id: { $in: courseIds }, status: 'active' }),
      InstructorEarning.aggregate([
        {
          $match: {
            instructor_id: mongoose.Types.ObjectId.createFromHexString(instructor_id),
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        { $group: { _id: { month: { $month: '$createdAt' } }, earning: { $sum: '$net_earning' } } },
        { $sort: { '_id.month': 1 } }
      ])
    ]);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = earningsByMonth.map((entry) => ({
      month: MONTHS[(entry._id.month || 1) - 1],
      earning: parseFloat(entry.earning || 0)
    }));

    return res.json({
      success: true,
      data: {
        stats: {
          totalEarnings: totalEarningsAgg[0]?.total || 0,
          totalEnrollments,
          avgRating: 0
        },
        earningsByMonth: chartData
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

module.exports = {
  getLessons,
  createLesson,
  updateLesson,
  togglePublish,
  deleteLesson,
  getQuiz,
  submitQuiz,
  createQuiz,
  getInstructorAnalytics
};
