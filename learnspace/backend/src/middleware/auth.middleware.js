// ============================================================
// LearnSpace - Authentication & Authorization Middleware (MongoDB)
// ============================================================
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// ── Verify JWT Token ───────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password -reset_password_token -reset_password_expires');

    if (!user) return res.status(401).json({ success: false, message: 'Token is no longer valid.' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account has been deactivated.' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    next(error);
  }
};

// ── Role-Based Access Control ──────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// ── Verified Instructor Only ───────────────────────────────
const verifiedInstructor = async (req, res, next) => {
  const { InstructorProfile } = require('../models');

  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Instructor access required.' });
  }

  if (req.user.role === 'admin') return next();

  const profile = await InstructorProfile.findOne({ user_id: req.user._id });
  if (!profile || profile.verification_status !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Your instructor account is not yet verified. Please wait for admin approval.'
    });
  }

  req.instructorProfile = profile;
  next();
};

// ── Enrolled Student Check ─────────────────────────────────
const enrolledStudent = async (req, res, next) => {
  const { Enrollment, Course } = require('../models');
  const courseId = req.params.courseId || req.params.id;

  if (req.user.role === 'admin') return next();

  if (req.user.role === 'instructor') {
    const course = await Course.findOne({ _id: courseId, instructor_id: req.user._id });
    if (course) return next();
  }

  const enrollment = await Enrollment.findOne({
    student_id: req.user._id, course_id: courseId, status: 'active'
  });

  if (!enrollment) {
    return res.status(403).json({ success: false, message: 'You are not enrolled in this course.' });
  }

  req.enrollment = enrollment;
  next();
};

// ── Optional Auth ──────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -reset_password_token');
    if (user && user.is_active) req.user = user;
    next();
  } catch {
    next();
  }
};

module.exports = { protect, authorize, verifiedInstructor, enrolledStudent, optionalAuth };
