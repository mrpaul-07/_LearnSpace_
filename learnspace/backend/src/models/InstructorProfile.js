const mongoose = require('mongoose');

const instructorProfileSchema = new mongoose.Schema({
  user_id:                 { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio:                     { type: String, default: null },
  expertise:               { type: [String], default: [] },
  qualifications:          { type: String, default: null },
  verification_status:     { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  rejection_reason:        { type: String, default: null },
  nid_document:            { type: String, default: null },
  certificate_document:    { type: String, default: null },
  documents:               { type: [String], default: [] },
  total_earnings:          { type: Number, default: 0 },
  total_payouts:           { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('InstructorProfile', instructorProfileSchema);
