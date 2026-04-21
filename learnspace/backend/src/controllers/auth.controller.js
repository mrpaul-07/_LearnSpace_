const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const InstructorProfile = require('../models/InstructorProfile');

const signAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    }
  );
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.reset_password_token;
  delete obj.reset_password_expires;
  return obj;
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || '',
      is_active: true,
    });

    if (role === 'instructor') {
      await InstructorProfile.create({
        user_id: user._id,
        verification_status: 'pending',
      });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        instructor_status: role === 'instructor' ? 'pending' : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const instructorProfile =
      user.role === 'instructor'
        ? await InstructorProfile.findOne({ user_id: user._id })
        : null;

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          ...sanitizeUser(user),
          instructor_status: instructorProfile?.verification_status || null,
        },
        accessToken,
        refreshToken,
        instructor_profile: instructorProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.headers['x-refresh-token'];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    return res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.reset_password_token = hashedToken;
    user.reset_password_expires = Date.now() + 1000 * 60 * 15;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset token generated.',
      data: {
        resetToken: rawToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password.',
      error: error.message,
    });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -reset_password_token -reset_password_expires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const instructorProfile = user.role === 'instructor'
      ? await InstructorProfile.findOne({ user_id: user._id })
      : null;

    return res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          instructor_status: instructorProfile?.verification_status || null,
        },
        instructor_profile: instructorProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user data.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};