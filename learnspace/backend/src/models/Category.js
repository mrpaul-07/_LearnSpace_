const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: null },
  icon:        { type: String, default: null },
  is_active:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
