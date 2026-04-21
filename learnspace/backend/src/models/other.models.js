const mongoose = require('mongoose');

// ── Enrollment ─────────────────────────────────────────────
const enrollmentSchema = new mongoose.Schema({
  student_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  payment_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  status:           { type: String, enum: ['active', 'refunded', 'cancelled'], default: 'active' },
  progress_percent: { type: Number, default: 0 },
  last_accessed:    { type: Date, default: null },
  completed_at:     { type: Date, default: null },
  enrolled_at:      { type: Date, default: Date.now },
}, { timestamps: true });
enrollmentSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

// ── Payment ────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  student_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount:              { type: Number, required: true },
  currency:            { type: String, default: 'BDT' },
  gateway:             { type: String, default: 'free' },
  status:              { type: String, enum: ['pending', 'completed', 'refunded', 'failed'], default: 'pending' },
  transaction_id:      { type: String, default: null },
  platform_fee:        { type: Number, default: 0 },
  instructor_earning:  { type: Number, default: 0 },
  paid_at:             { type: Date, default: null },
}, { timestamps: true });

// ── InstructorEarning ──────────────────────────────────────
const instructorEarningSchema = new mongoose.Schema({
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  payment_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  gross_amount:  { type: Number, default: 0 },
  platform_fee:  { type: Number, default: 0 },
  net_earning:   { type: Number, default: 0 },
  status:        { type: String, enum: ['pending', 'paid'], default: 'pending' },
}, { timestamps: true });

// ── Progress ───────────────────────────────────────────────
const progressSchema = new mongoose.Schema({
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  is_completed:  { type: Boolean, default: false },
  completed_at:  { type: Date, default: null },
  watch_time:    { type: Number, default: 0 },
  last_position: { type: Number, default: 0 },
}, { timestamps: true });
progressSchema.index({ student_id: 1, lesson_id: 1 }, { unique: true });

// ── Certificate ────────────────────────────────────────────
const certificateSchema = new mongoose.Schema({
  student_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificate_number: { type: String, unique: true },
  pdf_url:            { type: String, default: null },
  verification_hash:  { type: String, unique: true },
  issued_at:          { type: Date, default: Date.now },
}, { timestamps: true });

// ── Quiz ───────────────────────────────────────────────────
const quizQuestionSchema = new mongoose.Schema({
  question_text:  { type: String, required: true },
  question_type:  { type: String, enum: ['mcq', 'true_false', 'short_answer'], default: 'mcq' },
  options:        { type: mongoose.Schema.Types.Mixed, default: [] },
  correct_answer: { type: String, default: null },
  explanation:    { type: String, default: null },
  points:         { type: Number, default: 1 },
  order_index:    { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema({
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  title:         { type: String, required: true },
  description:   { type: String, default: null },
  time_limit:    { type: Number, default: null },
  passing_score: { type: Number, default: 60 },
  max_attempts:  { type: Number, default: 3 },
  is_published:  { type: Boolean, default: false },
  questions:     [quizQuestionSchema],
}, { timestamps: true });

const quizResultSchema = new mongoose.Schema({
  quiz_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score:          { type: Number, default: 0 },
  total_points:   { type: Number, default: 0 },
  earned_points:  { type: Number, default: 0 },
  passed:         { type: Boolean, default: false },
  answers:        { type: mongoose.Schema.Types.Mixed, default: [] },
  attempt_number: { type: Number, default: 1 },
  time_taken:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  Enrollment:         mongoose.model('Enrollment', enrollmentSchema),
  Payment:            mongoose.model('Payment', paymentSchema),
  InstructorEarning:  mongoose.model('InstructorEarning', instructorEarningSchema),
  Progress:           mongoose.model('Progress', progressSchema),
  Certificate:        mongoose.model('Certificate', certificateSchema),
  Quiz:               mongoose.model('Quiz', quizSchema),
  QuizResult:         mongoose.model('QuizResult', quizResultSchema),
};
