// ============================================================
// LearnSpace - Course Controller (MongoDB)
// ============================================================
const mongoose = require('mongoose');
const {
  Course, User, Category, Lesson, Enrollment
} = require('../models');
const { uploadToCloud } = require('../services/upload.service');
const logger = require('../utils/logger');

const safeParseJSON = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const generateSlug = (title, suffix) => {
  const base = (title || 'course')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);

  return `${base}-${suffix}`;
};

const isValidObjectId = (value) => typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

const normalizeRefId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
};

// GET /api/courses
const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      level,
      language,
      min_price,
      max_price,
      sort = 'newest',
      is_free
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const filter = { status: 'published' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category_id = category;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (is_free === 'true') filter.is_free = true;

    if (min_price || max_price) {
      filter.price = {};
      if (min_price) filter.price.$gte = parseFloat(min_price);
      if (max_price) filter.price.$lte = parseFloat(max_price);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { total_enrollments: -1 },
      rating: { avg_rating: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 }
    };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor_id', 'id name avatar')
        .populate('category_id', 'id name')
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-rejection_reason'),
      Course.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    logger.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
};

// GET /api/courses/featured
const getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .populate('instructor_id', 'id name avatar')
      .populate('category_id', 'id name')
      .sort({ total_enrollments: -1 })
      .limit(8);

    res.json({ success: true, data: { courses } });
  } catch (error) {
    logger.error('Get featured courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured courses.' });
  }
};

// GET /api/courses/instructor/my-courses
const getInstructorCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const filter = { instructor_id: req.user.id };
    if (status) filter.status = status;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('category_id', 'id name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Course.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      }
    });
  } catch (error) {
    logger.error('Get instructor courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your courses.' });
  }
};

// GET /api/courses/:id
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    let filter = { _id: id, status: 'published' };

    if (req.user?.role === 'admin') {
      filter = { _id: id };
    } else if (req.user?.role === 'instructor') {
      filter = {
        _id: id,
        $or: [
          { status: 'published' },
          { instructor_id: req.user.id }
        ]
      };
    }

    const course = await Course.findOne(filter)
      .populate('instructor_id', 'id name avatar')
      .populate('category_id');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const lessons = await Lesson.find({ course_id: course._id, is_published: true })
      .select('id title title_bn type duration order_index is_preview')
      .sort({ order_index: 1 });

    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        student_id: req.user.id,
        course_id: course._id,
        status: 'active'
      });
      isEnrolled = Boolean(enrollment);
    }

    res.json({
      success: true,
      data: {
        course: {
          ...course.toJSON(),
          lessons
        },
        isEnrolled
      }
    });
  } catch (error) {
    logger.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course.' });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  try {
    const {
      title,
      title_bn,
      description,
      description_bn,
      short_description,
      category_id,
      price,
      discount_price,
      currency,
      level,
      language,
      requirements,
      what_you_learn,
      tags,
      is_free
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Course title is required.' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Course description is required.' });
    }

    const isFreeValue = is_free === true || is_free === 'true';
    const normalizedCategoryId = normalizeRefId(category_id);
    const parsedPrice = isFreeValue ? 0 : (parseFloat(price) || 0);
    const parsedDiscount = (!isFreeValue
      && discount_price !== ''
      && discount_price != null
      && !Number.isNaN(parseFloat(discount_price)))
      ? parseFloat(discount_price)
      : null;

    const slug = generateSlug(
      title.trim(),
      `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    );

    const course = await Course.create({
      instructor_id: req.user.id,
      title: title.trim(),
      title_bn: title_bn?.trim() || null,
      description: description.trim(),
      description_bn: description_bn?.trim() || null,
      short_description: short_description?.trim() || null,
      category_id: normalizedCategoryId || null,
      price: parsedPrice,
      discount_price: parsedDiscount,
      currency: currency || 'BDT',
      level: level || 'beginner',
      language: language || 'en',
      requirements: safeParseJSON(requirements),
      what_you_learn: safeParseJSON(what_you_learn),
      tags: safeParseJSON(tags),
      is_free: isFreeValue,
      status: 'draft',
      slug,
      total_lessons: 0,
      total_enrollments: 0,
      avg_rating: 0
    });

    if (req.file) {
      try {
        const thumbnailUrl = await uploadToCloud(req.file, 'course-thumbnails');
        if (thumbnailUrl) {
          course.thumbnail = thumbnailUrl;
          await course.save();
        }
      } catch (uploadError) {
        logger.error('Thumbnail upload error (non-fatal):', uploadError.message);
      }
    }

    const freshCourse = await Course.findById(course._id).populate('category_id', 'id name');

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course: freshCourse }
    });
  } catch (error) {
    logger.error('Create course error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A course with that slug already exists.' });
    }

    res.status(500).json({ success: false, message: 'Failed to create course. Please try again.' });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    const course = await Course.findOne({ _id: id, instructor_id: req.user.id });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or not authorized.' });
    }

    const allowedFields = [
      'title',
      'title_bn',
      'description',
      'description_bn',
      'short_description',
      'category_id',
      'price',
      'discount_price',
      'currency',
      'level',
      'language',
      'requirements',
      'what_you_learn',
      'tags',
      'is_free'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    ['requirements', 'what_you_learn', 'tags'].forEach((field) => {
      if (updates[field] !== undefined) {
        updates[field] = safeParseJSON(updates[field]);
      }
    });

    if (updates.category_id !== undefined) {
      const normalizedCategoryId = normalizeRefId(updates.category_id);
      updates.category_id = normalizedCategoryId || null;
    }

    if (updates.price !== undefined) {
      updates.price = (updates.price === '' || updates.price === null)
        ? 0
        : (parseFloat(updates.price) || 0);
    }

    if (updates.discount_price !== undefined) {
      const discountValue = updates.discount_price;
      updates.discount_price = (
        discountValue === ''
        || discountValue === null
        || Number.isNaN(parseFloat(discountValue))
      )
        ? null
        : parseFloat(discountValue);
    }

    if (updates.is_free !== undefined) {
      updates.is_free = updates.is_free === true || updates.is_free === 'true';

      if (updates.is_free) {
        updates.price = 0;
        updates.discount_price = null;
      }
    }

    if (req.file) {
      try {
        const url = await uploadToCloud(req.file, 'course-thumbnails');
        if (url) updates.thumbnail = url;
      } catch (uploadError) {
        logger.error('Thumbnail update error:', uploadError.message);
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, updates, { new: true })
      .populate('category_id', 'id name');

    res.json({
      success: true,
      message: 'Course updated.',
      data: { course: updatedCourse }
    });
  } catch (error) {
    logger.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
};

// POST /api/courses/:id/submit
const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    const course = await Course.findOne({ _id: id, instructor_id: req.user.id });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (!course.title || !course.description) {
      return res.status(400).json({
        success: false,
        message: 'Course must have a title and description.'
      });
    }

    const lessonCount = await Lesson.countDocuments({
      course_id: course._id,
      is_published: true
    });

    if (lessonCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one published lesson before submitting.'
      });
    }

    course.status = 'pending_review';
    await course.save();

    res.json({ success: true, message: 'Course submitted for admin review.' });
  } catch (error) {
    logger.error('Submit for review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit course.' });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    const course = await Course.findOne({ _id: id, instructor_id: req.user.id });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (course.total_enrollments > 0) {
      course.status = 'archived';
      await course.save();
      return res.json({
        success: true,
        message: 'Course archived (has enrolled students).'
      });
    }

    await course.deleteOne();
    return res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    logger.error('Delete course error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  submitForReview,
  deleteCourse,
  getInstructorCourses,
  getFeaturedCourses
};
