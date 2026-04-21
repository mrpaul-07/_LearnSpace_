const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  meeting_url:   { type: String, required: true },
  // e.g. Zoom, Google Meet, Jitsi — just label for display
  platform:      { type: String, enum: ['zoom', 'meet', 'jitsi', 'other'], default: 'other' },
  scheduled_at:  { type: Date, required: true },
  duration_min:  { type: Number, default: 60 },
  status:        { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });

liveClassSchema.index({ course_id: 1, scheduled_at: -1 });

module.exports = mongoose.model('LiveClass', liveClassSchema);
