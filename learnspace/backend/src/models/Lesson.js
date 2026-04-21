const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title:        { type: String, required: true },
  title_bn:     { type: String, default: null },
  description:  { type: String, default: null },
  type:         { type: String, enum: ['video', 'document', 'quiz', 'text'], default: 'video' },
  content_url:  { type: String, default: null },
  duration:     { type: Number, default: 0 },
  order_index:  { type: Number, default: 1 },
  is_preview:   { type: Boolean, default: false },
  is_published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
