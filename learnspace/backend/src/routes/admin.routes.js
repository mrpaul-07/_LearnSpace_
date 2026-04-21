const express = require('express');
const router = express.Router();
const { getDashboard, getPendingInstructors, verifyInstructor, getPendingCourses, reviewCourse, getUsers, toggleUserStatus, getRevenueReport } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/instructors/pending', getPendingInstructors);
router.patch('/instructors/:id/verify', verifyInstructor);
router.get('/courses/pending', getPendingCourses);
router.patch('/courses/:id/review', reviewCourse);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/reports/revenue', getRevenueReport);

module.exports = router;
