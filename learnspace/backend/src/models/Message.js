const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  content:     { type: String, required: true, maxlength: 2000 },
  is_read:     { type: Boolean, default: false },
}, { timestamps: true });

// Fast conversation lookup
messageSchema.index({ sender_id: 1, receiver_id: 1, createdAt: -1 });
messageSchema.index({ receiver_id: 1, is_read: 1 });

module.exports = mongoose.model('Message', messageSchema);
