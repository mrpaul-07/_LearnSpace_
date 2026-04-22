const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title:              { type: String, required: true, trim: true },
  title_bn:           { type: String, default: null },
  slug:               { type: String, unique: true, lowercase: true },
  description:        { type: String, default: null },
  description_bn:     { type: String, default: null },
  short_description:  { type: String, default: null },
  thumbnail:          { type: String, default: null },
  instructor_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  price:              { type: Number, default: 0 },
  discount_price:     { type: Number, default: null },
  currency:           { type: String, default: 'BDT' },
  is_free:            { type: Boolean, default: false },
  status:             { type: String, enum: ['draft', 'pending_review', 'published', 'rejected', 'archived'], default: 'draft' },
  rejection_reason:   { type: String, default: null },
  level:              { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all levels', 'all_levels'], default: 'beginner' },
  language:           { type: String, enum: ['en', 'bn', 'both'], default: 'en' },
  total_lessons:      { type: Number, default: 0 },
  total_enrollments:  { type: Number, default: 0 },
  avg_rating:         { type: Number, default: 0 },
  total_reviews:      { type: Number, default: 0 },
  requirements:       { type: [String], default: [] },
  what_you_learn:     { type: [String], default: [] },
  tags:               { type: [String], default: [] },
}, { timestamps: true });

// Text index for richer search across title/description/tags
courseSchema.index({ title: 'text', description: 'text', short_description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
