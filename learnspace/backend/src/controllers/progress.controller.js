// ============================================================
// LearnSpace - Progress + Certificate Controller (MongoDB)
// ============================================================
const { Progress, Enrollment, Lesson, Course, User, Certificate } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { uploadToCloud } = require('../services/upload.service');

const markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { watch_time, last_position } = req.body;
    const student_id = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });

    let progress = await Progress.findOne({ student_id, lesson_id: lessonId });
    if (!progress) {
      progress = await Progress.create({
        student_id, lesson_id: lessonId, course_id: lesson.course_id,
        is_completed: true, completed_at: new Date(),
        watch_time: watch_time || 0, last_position: last_position || 0
      });
    } else {
      progress.is_completed = true;
      progress.completed_at = progress.completed_at || new Date();
      progress.watch_time = Math.max(progress.watch_time, watch_time || 0);
      progress.last_position = last_position || progress.last_position;
      await progress.save();
    }

    const totalLessons = await Lesson.countDocuments({ course_id: lesson.course_id, is_published: true, type: { $ne: 'quiz' } });
    const completedLessons = await Progress.countDocuments({ student_id, course_id: lesson.course_id, is_completed: true });
    const progressPercent = totalLessons > 0 ? Math.min(100, (completedLessons / totalLessons) * 100) : 0;

    await Enrollment.findOneAndUpdate(
      { student_id, course_id: lesson.course_id },
      { progress_percent: progressPercent, last_accessed: new Date() }
    );

    if (progressPercent >= 100) {
      // Auto-issue a certificate, but don't crash the request if it fails
      issueCertificateInternal(student_id, lesson.course_id)
        .catch(err => logger.error('Auto cert error:', err.message));
    }

    res.json({ success: true, message: 'Progress updated.', data: { progress_percent: progressPercent, is_completed: true } });
  } catch (error) {
    logger.error('Mark lesson complete error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress.' });
  }
};

const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student_id = req.user.id;

    const lessons = await Lesson.find({ course_id: courseId, is_published: true })
      .select('id title type order_index')
      .sort({ order_index: 1 });

    const progressRecords = await Progress.find({ student_id, course_id: courseId });
    const progressMap = {};
    progressRecords.forEach(p => { progressMap[p.lesson_id.toString()] = p; });

    const enrollment = await Enrollment.findOne({ student_id, course_id: courseId });

    const lessonsWithProgress = lessons.map(lesson => ({
      ...lesson.toJSON(),
      is_completed:  progressMap[lesson._id.toString()]?.is_completed || false,
      last_position: progressMap[lesson._id.toString()]?.last_position || 0,
      watch_time:    progressMap[lesson._id.toString()]?.watch_time || 0
    }));

    res.json({ success: true, data: { lessons: lessonsWithProgress, overall_progress: enrollment?.progress_percent || 0, last_accessed: enrollment?.last_accessed } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress.' });
  }
};

const updateWatchPosition = async (req, res) => {
  try {
    const { last_position, watch_time } = req.body;
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });

    await Progress.findOneAndUpdate(
      { student_id: req.user.id, lesson_id: req.params.lessonId },
      { course_id: lesson.course_id, last_position: last_position || 0, watch_time: watch_time || 0 },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Position saved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update position.' });
  }
};

// Internal: actually create the cert + PDF (callable from auto-trigger or HTTP)
const issueCertificateInternal = async (student_id, courseId) => {
  const enrollment = await Enrollment.findOne({ student_id, course_id: courseId, status: 'active' });
  if (!enrollment) throw new Error('Not enrolled.');
  if (parseFloat(enrollment.progress_percent) < 100) {
    throw new Error(`Course not yet complete. Progress: ${enrollment.progress_percent}%`);
  }

  const existing = await Certificate.findOne({ student_id, course_id: courseId });
  if (existing) return existing;

  const student = await User.findById(student_id);
  const course = await Course.findById(courseId).populate('instructor_id', 'name');

  const certNumber = `LS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const verificationHash = crypto
    .createHash('sha256')
    .update(`${student_id}-${courseId}-${certNumber}`)
    .digest('hex');

  const pdfBuffer = await generateCertificatePDF({
    studentName: student.name,
    courseName: course.title,
    instructorName: course.instructor_id?.name,
    certNumber,
    issuedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  let pdfUrl = null;
  try {
    pdfUrl = await uploadToCloud(pdfBuffer, 'certificates', `${certNumber}.pdf`, 'application/pdf');
  } catch (uploadErr) {
    logger.error('PDF upload error (non-fatal):', uploadErr.message);
  }

  const certificate = await Certificate.create({
    student_id, course_id: courseId,
    certificate_number: certNumber,
    pdf_url: pdfUrl,
    verification_hash: verificationHash
  });
  await Enrollment.findOneAndUpdate({ student_id, course_id: courseId }, { completed_at: new Date() });
  return certificate;
};

const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student_id = req.user.id;
    const certificate = await issueCertificateInternal(student_id, courseId);
    res.json({ success: true, message: 'Certificate ready.', data: { certificate } });
  } catch (error) {
    logger.error('Generate certificate error:', error);
    const status = /not enrolled/i.test(error.message) ? 403
                 : /not yet complete/i.test(error.message) ? 400
                 : 500;
    res.status(status).json({ success: false, message: error.message || 'Failed to generate certificate.' });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificate_number: req.params.certNumber })
      .populate('student_id', 'name')
      .populate('course_id', 'title');
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found or invalid.' });
    res.json({ success: true, data: { valid: true, certificate_number: certificate.certificate_number, student_name: certificate.student_id.name, course_title: certificate.course_id.title, issued_at: certificate.issued_at } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student_id: req.user.id })
      .populate('course_id', 'id title thumbnail')
      .sort({ issued_at: -1 });
    res.json({ success: true, data: { certificates } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificates.' });
  }
};

// ── PDF Certificate Generator ──────────────────────────────
const generateCertificatePDF = ({ studentName, courseName, instructorName, certNumber, issuedAt }) => {
  return new Promise((resolve, reject) => {
    const W = 595, H = 842;
    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 0, info: { Title: 'Certificate of Completion', Author: 'LearnSpace' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, W, H).fill('#FFFFFF');
    doc.rect(0, 0, W, 10).fill('#1e3a5f');
    doc.rect(0, H - 10, W, 10).fill('#1e3a5f');
    doc.rect(0, 0, 6, H).fill('#c9a84c');
    doc.rect(W - 6, 0, 6, H).fill('#c9a84c');
    doc.rect(22, 22, W - 44, H - 44).lineWidth(1.5).stroke('#1e3a5f');
    doc.rect(28, 28, W - 56, H - 56).lineWidth(0.6).stroke('#c9a84c');
    doc.rect(22, 22, W - 44, 90).fill('#1e3a5f');
    doc.fillColor('#c9a84c').fontSize(32).font('Helvetica-Bold').text('LearnSpace', 28, 42, { width: W - 56, align: 'center' });
    doc.fillColor('#a0b4c8').fontSize(10).font('Helvetica').text('Online Learning Platform', 28, 82, { width: W - 56, align: 'center' });
    doc.fillColor('#1e3a5f').fontSize(13).font('Helvetica').text('CERTIFICATE OF COMPLETION', 28, 140, { width: W - 56, align: 'center', characterSpacing: 2 });
    doc.moveTo(W / 2 - 120, 160).lineTo(W / 2 + 120, 160).lineWidth(1.5).stroke('#c9a84c');
    doc.fillColor('#666666').fontSize(12).font('Helvetica').text('This is to proudly certify that', 28, 190, { width: W - 56, align: 'center' });
    doc.fillColor('#1e3a5f').fontSize(36).font('Helvetica-Bold').text(studentName, 28, 218, { width: W - 56, align: 'center' });
    doc.moveTo(W / 2 - 140, 268).lineTo(W / 2 + 140, 268).lineWidth(1).stroke('#c9a84c');
    doc.fillColor('#666666').fontSize(12).font('Helvetica').text('has successfully completed the course', 28, 286, { width: W - 56, align: 'center' });
    doc.fillColor('#1e3a5f').fontSize(20).font('Helvetica-Bold').text(courseName, 60, 314, { width: W - 120, align: 'center' });
    if (instructorName) doc.fillColor('#999999').fontSize(11).font('Helvetica').text(`Instructed by: ${instructorName}`, 28, 370, { width: W - 56, align: 'center' });

    const cx = W / 2, cy = 490;
    doc.circle(cx, cy, 60).lineWidth(2).stroke('#c9a84c');
    doc.circle(cx, cy, 52).fill('#1e3a5f');
    doc.circle(cx, cy, 52).lineWidth(0.8).stroke('#c9a84c');
    doc.fillColor('#c9a84c').fontSize(8).font('Helvetica-Bold').text('CERTIFICATE', cx - 26, cy - 22, { lineBreak: false });
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('✓', cx - 9, cy - 10, { lineBreak: false });
    doc.fillColor('#c9a84c').fontSize(7.5).font('Helvetica-Bold').text('OF COMPLETION', cx - 28, cy + 14, { lineBreak: false });

    doc.moveTo(60, 580).lineTo(W - 60, 580).lineWidth(0.5).stroke('#DDDDDD');
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold').text('LearnSpace Academy', 60, 600, { width: 180 });
    doc.moveTo(60, 630).lineTo(210, 630).lineWidth(1).stroke('#1e3a5f');
    doc.fillColor('#999999').fontSize(9).font('Helvetica').text('Authorized Signature', 60, 636);
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold').text(issuedAt, W - 220, 600, { width: 160, align: 'right' });
    doc.moveTo(W - 210, 630).lineTo(W - 60, 630).lineWidth(1).stroke('#1e3a5f');
    doc.fillColor('#999999').fontSize(9).font('Helvetica').text('Date of Issue', W - 180, 636, { width: 120, align: 'right' });
    doc.fillColor('#555555').fontSize(10).font('Helvetica-Bold').text(`Certificate No: ${certNumber}`, 28, H - 28, { width: W - 56, align: 'center' });

    doc.end();
  });
};

module.exports = { markLessonComplete, getCourseProgress, updateWatchPosition, generateCertificate, verifyCertificate, getMyCertificates };
