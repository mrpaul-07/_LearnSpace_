// ============================================================
// LearnSpace - Payment Controller (MongoDB)
// ============================================================
const { Enrollment, Course, Payment, InstructorEarning } = require('../models');
const logger = require('../utils/logger');

// ── POST /api/payments/create-order ───────────────────────
const createOrder = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const { course_id, gateway = 'free' } = req.body;
    const student_id = req.user.id;

    const course = await Course.findOne({ _id: course_id, status: 'published' });
    if (!course) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Course not found or not available.' });
    }

    const existing = await Enrollment.findOne({ student_id, course_id });
    if (existing) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        already_enrolled: true,
        message: 'You are already enrolled in this course.',
        data: { enrollment: existing, payment: null }
      });
    }

    if (String(course.instructor_id) === String(student_id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'You cannot enroll in your own course.' });
    }

    const price = parseFloat(course.discount_price || course.price || 0);
    const isFree = course.is_free || price === 0 || gateway === 'free' || gateway === 'demo';
    const effectiveGateway = isFree ? 'free' : gateway;
    const platformFee = isFree ? 0 : price * 0.3;
    const instructorEarning = isFree ? 0 : price * 0.7;

    const payment = await Payment.create([{
      student_id, course_id,
      amount: price,
      currency: course.currency || 'BDT',
      gateway: effectiveGateway,
      status: 'completed',
      transaction_id: `${effectiveGateway.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      platform_fee: platformFee,
      instructor_earning: instructorEarning,
      paid_at: new Date()
    }], { session });

    const enrollment = await Enrollment.create([{
      student_id, course_id,
      payment_id: payment[0]._id,
      status: 'active',
      progress_percent: 0,
      enrolled_at: new Date()
    }], { session });

    await Course.findByIdAndUpdate(course_id, { $inc: { total_enrollments: 1 } }, { session });

    if (!isFree && price > 0) {
      await InstructorEarning.create([{
        instructor_id: course.instructor_id,
        course_id,
        payment_id: payment[0]._id,
        gross_amount: price,
        platform_fee: platformFee,
        net_earning: instructorEarning,
        status: 'pending'
      }], { session });
    }

    await session.commitTransaction();

    res.json({ success: true, message: 'Enrolled successfully!', data: { enrollment: enrollment[0], payment: payment[0] } });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Create order error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
    }
    res.status(500).json({ success: false, message: 'Payment processing failed: ' + error.message });
  } finally {
    session.endSession();
  }
};

// ── POST /api/payments/stripe/confirm ─────────────────────
const confirmStripePayment = async (req, res) => {
  res.status(501).json({ success: false, message: 'Stripe not yet configured.' });
};

// ── POST /api/payments/webhook ─────────────────────────────
const stripeWebhook = async (req, res) => {
  res.json({ received: true });
};

// ── GET /api/payments/history ─────────────────────────────
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find({ student_id: req.user.id })
        .populate('course_id', 'id title thumbnail')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments({ student_id: req.user.id })
    ]);

    res.json({ success: true, data: { payments, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) {
    logger.error('Payment history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
};

// ── POST /api/payments/refund/:paymentId ──────────────────
const processRefund = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status === 'refunded') return res.status(400).json({ success: false, message: 'Already refunded.' });

    payment.status = 'refunded';
    await payment.save({ session });

    await Enrollment.updateMany({ payment_id: payment._id }, { status: 'refunded' }, { session });
    await Course.findByIdAndUpdate(payment.course_id, { $inc: { total_enrollments: -1 } }, { session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Refund processed.' });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund.' });
  } finally {
    session.endSession();
  }
};

module.exports = { createOrder, confirmStripePayment, stripeWebhook, getPaymentHistory, processRefund };
