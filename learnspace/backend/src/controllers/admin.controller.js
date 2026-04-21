// ============================================================
// LearnSpace - Admin Controller (MongoDB)
// ============================================================
const { User, Course, InstructorProfile, Enrollment, Payment, InstructorEarning, Category } = require('../models');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

// ── GET /api/admin/dashboard ───────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalCourses, totalEnrollments, pendingInstructors, pendingCourses, recentPayments] =
      await Promise.all([
        User.countDocuments(),
        Course.countDocuments({ status: 'published' }),
        Enrollment.countDocuments({ status: 'active' }),
        InstructorProfile.countDocuments({ verification_status: 'pending' }),
        Course.countDocuments({ status: 'pending_review' }),
        Payment.find({ status: 'completed' })
          .populate('student_id', 'name email')
          .populate('course_id', 'title')
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const revenueByMonth = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalCourses, totalEnrollments, totalRevenue, pendingInstructors, pendingCourses },
        revenueByMonth,
        recentPayments
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

// ── GET /api/admin/instructors/pending ─────────────────────
const getPendingInstructors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [instructors, total] = await Promise.all([
      InstructorProfile.find({ verification_status: 'pending' })
        .populate('user_id', 'id name email createdAt')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InstructorProfile.countDocuments({ verification_status: 'pending' })
    ]);

    res.json({ success: true, data: { instructors, pagination: { total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending instructors.' });
  }
};

// ── PATCH /api/admin/instructors/:id/verify ────────────────
const verifyInstructor = async (req, res) => {
  try {
    const { action, reason } = req.body;

    // Try by InstructorProfile _id first, then by user_id
    let profile = await InstructorProfile.findById(req.params.id).populate('user_id');
    if (!profile) {
      profile = await InstructorProfile.findOne({ user_id: req.params.id }).populate('user_id');
    }

    if (!profile) return res.status(404).json({ success: false, message: 'Instructor not found.' });

    if (action === 'approve') {
      profile.verification_status = 'verified';
      await profile.save();
      await sendEmail({
        to: profile.user_id.email,
        subject: 'Your Instructor Application is Approved!',
        template: 'instructor-approved',
        data: { name: profile.user_id.name }
      });
    } else if (action === 'reject') {
      profile.verification_status = 'rejected';
      profile.rejection_reason = reason;
      await profile.save();
      await sendEmail({
        to: profile.user_id.email,
        subject: 'Instructor Application Update',
        template: 'instructor-rejected',
        data: { name: profile.user_id.name, reason }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    res.json({ success: true, message: `Instructor ${action}d successfully.` });
  } catch (error) {
    logger.error('Verify instructor error:', error);
    res.status(500).json({ success: false, message: 'Verification action failed.' });
  }
};

// ── GET /api/admin/courses/pending ─────────────────────────
const getPendingCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      Course.find({ status: 'pending_review' })
        .populate('instructor_id', 'id name email')
        .populate('category_id', 'id name')
        .sort({ updatedAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments({ status: 'pending_review' })
    ]);

    res.json({ success: true, data: { courses, pagination: { total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending courses.' });
  }
};

// ── PATCH /api/admin/courses/:id/review ───────────────────
const reviewCourse = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const course = await Course.findById(req.params.id).populate('instructor_id', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    if (action === 'approve') {
      course.status = 'published';
      course.rejection_reason = null;
      await course.save();
      await sendEmail({
        to: course.instructor_id.email,
        subject: `Course Approved: ${course.title}`,
        template: 'course-approved',
        data: { name: course.instructor_id.name, courseName: course.title }
      });
    } else if (action === 'reject') {
      course.status = 'rejected';
      course.rejection_reason = reason;
      await course.save();
      await sendEmail({
        to: course.instructor_id.email,
        subject: `Course Review Update: ${course.title}`,
        template: 'course-rejected',
        data: { name: course.instructor_id.name, courseName: course.title, reason }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    res.json({ success: true, message: `Course ${action}d successfully.` });
  } catch (error) {
    logger.error('Review course error:', error);
    res.status(500).json({ success: false, message: 'Course review failed.' });
  }
};

// ── GET /api/admin/users ───────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -reset_password_token -reset_password_expires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({ success: true, data: { users, pagination: { total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ── PATCH /api/admin/users/:id/toggle ─────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin.' });

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'}.`,
      data: { is_active: user.is_active }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

// ── GET /api/admin/reports/revenue ────────────────────────
const getRevenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'completed' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to);
    }

    const [revenueAgg, byGateway, topCourses] = await Promise.all([
      Payment.aggregate([
        { $match: match },
        { $group: {
            _id: null,
            totalRevenue:      { $sum: '$amount' },
            platformRevenue:   { $sum: '$platform_fee' },
            instructorRevenue: { $sum: '$instructor_earning' }
        }}
      ]),
      Payment.aggregate([
        { $match: match },
        { $group: { _id: '$gateway', total: { $sum: '$amount' } } }
      ]),
      Course.find({ status: 'published' })
        .sort({ total_enrollments: -1 })
        .limit(10)
        .select('title total_enrollments price')
    ]);

    const r = revenueAgg[0] || {};
    res.json({
      success: true,
      data: {
        totalRevenue:      r.totalRevenue      || 0,
        platformRevenue:   r.platformRevenue   || 0,
        instructorRevenue: r.instructorRevenue || 0,
        byGateway,
        topCourses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

module.exports = {
  getDashboard, getPendingInstructors, verifyInstructor,
  getPendingCourses, reviewCourse, getUsers, toggleUserStatus, getRevenueReport
};
