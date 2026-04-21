// ============================================================
// LearnSpace - Create Admin User Script
// Run: node src/scripts/createAdmin.js
// ============================================================
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, default: 'student' },
  is_active:   { type: Boolean, default: true },
  is_verified: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('MongoDB Connected');

    const existing = await User.findOne({ email: 'admin@learnspace.com' });
    if (existing) {
      console.log('Admin already exists!');
      console.log('Email:    admin@learnspace.com');
      console.log('Password: admin123456');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123456', 12);
    await User.create({
      name:        'Super Admin',
      email:       'admin@learnspace.com',
      password:    hashedPassword,
      role:        'admin',
      is_active:   true,
      is_verified: true,
    });

    console.log('Admin created successfully!');
    console.log('Email:    admin@learnspace.com');
    console.log('Password: admin123456');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();