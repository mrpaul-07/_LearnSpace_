// ============================================================
// LearnSpace - Main Server Entry Point (MongoDB Version)
// ============================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
require('dotenv').config();

// ── Connect to MongoDB ─────────────────────────────────────
connectDB();

const app = express();

// ── Trust proxy ────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Create uploads directory ───────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Security Middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate Limiting ──────────────────────────────────────────
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20  });
app.use('/api/', limiter);

// ── Body Parsing ───────────────────────────────────────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve Uploaded Files ───────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, require('./routes/auth.routes'));
app.use('/api/users',        require('./routes/user.routes'));
app.use('/api/courses',      require('./routes/course.routes'));
app.use('/api/lessons',      require('./routes/lesson.routes'));
app.use('/api/enrollments',  require('./routes/enrollment.routes'));
app.use('/api/payments',     require('./routes/payment.routes'));
app.use('/api/quizzes',      require('./routes/quiz.routes'));
app.use('/api/progress',     require('./routes/progress.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/analytics',    require('./routes/analytics.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/categories',   require('./routes/categories.routes'));
app.use('/api/chatbot',      require('./routes/chatbot.routes'));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Resource already exists' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`LearnSpace server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
