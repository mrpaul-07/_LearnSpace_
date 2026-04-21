const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, InstructorProfile } = require('../models');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadToCloud } = require('../services/upload.service');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -reset_password_token -reset_password_expires');
    const instructorProfile = user.role === 'instructor'
      ? await InstructorProfile.findOne({ user_id: user._id })
      : null;
    res.json({ success: true, data: { user, instructor_profile: instructorProfile } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    const { name, phone, language } = req.body;
    const updates = {};
    if (name)     updates.name = name;
    if (phone)    updates.phone = phone;
    if (language) updates.language = language;
    if (req.file) updates.avatar = await uploadToCloud(req.file, 'avatars');

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select('-password -reset_password_token -reset_password_expires');
    res.json({ success: true, message: 'Profile updated.', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(new_password, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// POST /api/users/instructor/apply
router.post('/instructor/apply', protect, authorize('instructor'), upload.fields([{ name: 'nid' }, { name: 'certificate' }]), async (req, res) => {
  try {
    const { expertise, qualifications, bio } = req.body;
    let profile = await InstructorProfile.findOne({ user_id: req.user.id });
    if (!profile) profile = await InstructorProfile.create({ user_id: req.user.id });

    // Normalize expertise: accept either an array or a comma-separated string
    let expertiseArr = [];
    if (Array.isArray(expertise)) expertiseArr = expertise;
    else if (typeof expertise === 'string' && expertise.trim()) {
      expertiseArr = expertise.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updates = {
      expertise: expertiseArr,
      qualifications: qualifications || null,
      bio: bio || null,
      verification_status: 'pending',
      rejection_reason: null
    };
    if (req.files?.nid)         updates.nid_document         = await uploadToCloud(req.files.nid[0], 'instructor-docs');
    if (req.files?.certificate) updates.certificate_document = await uploadToCloud(req.files.certificate[0], 'instructor-docs');

    await InstructorProfile.findByIdAndUpdate(profile._id, updates);
    res.json({ success: true, message: 'Application submitted for review.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Application failed.', error: error.message });
  }
});

module.exports = router;
