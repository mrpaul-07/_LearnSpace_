// ============================================================
// LearnSpace - Live Class Controller
// Instructor schedules a Zoom/Meet/Jitsi link.
// Enrolled students can see and join upcoming/live sessions.
// ============================================================
const mongoose = require('mongoose');
const { LiveClass, Course, Enrollment } = require('../models');
const logger = require('../utils/logger');

const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

const isValidUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

// POST /api/live-classes
// Instructor schedules a new session
const createLiveClass = async (req, res) => {
  try {
    const { course_id, title, description, meeting_url, platform, scheduled_at, duration_min } = req.body;

    if (!isValidId(course_id)) {
      return res.status(400).json({ success: false, message: 'Invalid course id.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    if (!meeting_url || !isValidUrl(meeting_url)) {
      return res.status(400).json({ success: false, message: 'A valid meeting URL is required.' });
    }
    if (!scheduled_at || isNaN(new Date(scheduled_at).getTime())) {
      return res.status(400).json({ success: false, message: 'A valid scheduled time is required.' });
    }

    // Must own the course (or be admin)
    const course = await Course.findById(course_id).select('instructor_id');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    if (req.user.role !== 'admin' && String(course.instructor_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only schedule classes for your own courses.' });
    }

    const liveClass = await LiveClass.create({
      course_id,
      instructor_id: course.instructor_id,
      title: title.trim(),
      description: (description || '').trim(),
      meeting_url: meeting_url.trim(),
      platform: platform || 'other',
      scheduled_at: new Date(scheduled_at),
      duration_min: parseInt(duration_min, 10) || 60,
      status: 'scheduled'
    });

    res.status(201).json({ success: true, data: { liveClass } });
  } catch (error) {
    logger.error('Create live class error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule class.' });
  }
};

// GET /api/live-classes/course/:courseId
// List upcoming + past classes for a course. Students must be enrolled.
const getCourseClasses = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course id.' });
    }

    // Access check
    const course = await Course.findById(courseId).select('instructor_id');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const isOwner = req.user?.role === 'instructor' && String(course.instructor_id) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Login required.' });
      }
      const enrollment = await Enrollment.findOne({ student_id: req.user.id, course_id: courseId });
      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'Enroll in this course to see its live classes.' });
      }
    }

    const classes = await LiveClass.find({ course_id: courseId })
      .sort({ scheduled_at: -1 })
      .limit(100);

    res.json({ success: true, data: { classes } });
  } catch (error) {
    logger.error('Get course classes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live classes.' });
  }
};

// PATCH /api/live-classes/:id
// Update or cancel (instructor-owned)
const updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found.' });

    if (req.user.role !== 'admin' && String(liveClass.instructor_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const allowed = ['title', 'description', 'meeting_url', 'platform', 'scheduled_at', 'duration_min', 'status'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        liveClass[field] = req.body[field];
      }
    }
    await liveClass.save();

    res.json({ success: true, data: { liveClass } });
  } catch (error) {
    logger.error('Update live class error:', error);
    res.status(500).json({ success: false, message: 'Failed to update live class.' });
  }
};

// DELETE /api/live-classes/:id
const deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: 'Class not found.' });

    if (req.user.role !== 'admin' && String(liveClass.instructor_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await liveClass.deleteOne();
    res.json({ success: true, message: 'Live class deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete class.' });
  }
};

module.exports = { createLiveClass, getCourseClasses, updateLiveClass, deleteLiveClass };
