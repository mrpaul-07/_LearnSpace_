const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

// One student = one review per course
reviewSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
