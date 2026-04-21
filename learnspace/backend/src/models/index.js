const User               = require('./User');
const InstructorProfile  = require('./InstructorProfile');
const Category           = require('./Category');
const Course             = require('./Course');
const Lesson             = require('./Lesson');
const {
  Enrollment, Payment, InstructorEarning,
  Progress, Certificate, Quiz, QuizResult
} = require('./other.models');

module.exports = {
  User, InstructorProfile, Category, Course, Lesson,
  Enrollment, Payment, InstructorEarning,
  Progress, Certificate, Quiz, QuizResult
};
