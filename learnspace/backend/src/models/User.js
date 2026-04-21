const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:                   { type: String, required: true, trim: true },
  email:                  { type: String, required: true, unique: true, lowercase: true },
  password:               { type: String, required: true },
  role:                   { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  avatar:                 { type: String, default: null },
  phone:                  { type: String, default: null },
  language:               { type: String, default: 'en' },
  is_active:              { type: Boolean, default: true },
  is_verified:            { type: Boolean, default: false },
  last_login:             { type: Date, default: null },
  reset_password_token:   { type: String, default: null },
  reset_password_expires: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
