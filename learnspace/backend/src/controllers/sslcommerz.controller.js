// ============================================================
// LearnSpace - SSLCommerz Sandbox Integration
//
// Setup:
//   1. Register at https://developer.sslcommerz.com/ (free)
//   2. Get sandbox Store ID and Store Password
//   3. Add to backend .env:
//        SSLCOMMERZ_STORE_ID=your_store_id
//        SSLCOMMERZ_STORE_PASS=your_store_pass
//        SSLCOMMERZ_IS_LIVE=false
//        CLIENT_URL=http://localhost:3000
//        API_URL=http://localhost:5000
//
// Without these env vars, the controller returns a clear error
// telling the user how to enable it. The rest of the app
// continues to work with the 'demo' / 'free' gateways.
// ============================================================
const axios = require('axios');
const mongoose = require('mongoose');
const { Course, Payment, Enrollment, InstructorEarning, User } = require('../models');
const logger = require('../utils/logger');

const SSL_BASE = () => process.env.SSLCOMMERZ_IS_LIVE === 'true'
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

const isConfigured = () => Boolean(
  process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASS
);

// POST /api/payments/sslcommerz/init
// Creates a PENDING payment + returns the SSLCommerz redirect URL
const initSslcommerz = async (req, res) => {
  if (!isConfigured()) {
    return res.status(501).json({
      success: false,
      message: 'SSLCommerz is not configured. Add SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASS to backend .env file.',
      configured: false
    });
  }

  try {
    const { course_id } = req.body;
    const student_id = req.user.id;

    const course = await Course.findOne({ _id: course_id, status: 'published' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const existing = await Enrollment.findOne({ student_id, course_id });
    if (existing) {
      return res.status(200).json({
        success: true,
        already_enrolled: true,
        message: 'You are already enrolled in this course.'
      });
    }

    const student = await User.findById(student_id);
    const amount = parseFloat(course.discount_price || course.price || 0);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This course is free — use the free enrollment endpoint.'
      });
    }

    // Create a PENDING payment first
    const payment = await Payment.create({
      student_id,
      course_id,
      amount,
      currency: course.currency || 'BDT',
      gateway: 'sslcommerz',
      status: 'pending',
      transaction_id: `SSL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      platform_fee: amount * 0.3,
      instructor_earning: amount * 0.7
    });

    const apiBase = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
    const clientBase = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

    const sslData = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASS,
      total_amount: amount,
      currency: course.currency || 'BDT',
      tran_id: payment.transaction_id,
      success_url: `${apiBase}/api/payments/sslcommerz/success`,
      fail_url: `${apiBase}/api/payments/sslcommerz/fail?tran_id=${payment.transaction_id}`,
      cancel_url: `${apiBase}/api/payments/sslcommerz/cancel?tran_id=${payment.transaction_id}`,
      ipn_url: `${apiBase}/api/payments/sslcommerz/ipn`,
      shipping_method: 'NO',
      product_name: course.title.substring(0, 50),
      product_category: 'Online Course',
      product_profile: 'general',
      cus_name: student.name,
      cus_email: student.email,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: student.phone || '01711111111'
    };

    const response = await axios.post(
      `${SSL_BASE()}/gwprocess/v4/api.php`,
      new URLSearchParams(sslData).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.data?.status === 'SUCCESS' && response.data?.GatewayPageURL) {
      return res.json({
        success: true,
        data: {
          payment_id: payment._id,
          redirect_url: response.data.GatewayPageURL
        }
      });
    }

    // Mark the payment as failed if SSL didn't accept
    payment.status = 'failed';
    await payment.save();
    return res.status(502).json({
      success: false,
      message: response.data?.failedreason || 'SSLCommerz init failed.'
    });
  } catch (error) {
    logger.error('SSLCommerz init error:', error.message);
    return res.status(500).json({ success: false, message: 'Payment init failed.' });
  }
};

// Internal: complete a payment + create enrollment + earnings record
const finalizeSuccessfulPayment = async (transactionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payment = await Payment.findOne({ transaction_id: transactionId }).session(session);
    if (!payment) throw new Error('Payment record not found.');
    if (payment.status === 'completed') {
      await session.commitTransaction();
      return payment;
    }

    payment.status = 'completed';
    payment.paid_at = new Date();
    await payment.save({ session });

    const existing = await Enrollment.findOne({
      student_id: payment.student_id,
      course_id: payment.course_id
    }).session(session);

    if (!existing) {
      await Enrollment.create([{
        student_id: payment.student_id,
        course_id: payment.course_id,
        payment_id: payment._id,
        status: 'active',
        progress_percent: 0,
        enrolled_at: new Date()
      }], { session });

      const course = await Course.findById(payment.course_id).session(session);
      await Course.findByIdAndUpdate(payment.course_id, {
        $inc: { total_enrollments: 1 }
      }, { session });

      if (course && payment.amount > 0) {
        await InstructorEarning.create([{
          instructor_id: course.instructor_id,
          course_id: payment.course_id,
          payment_id: payment._id,
          gross_amount: payment.amount,
          platform_fee: payment.platform_fee,
          net_earning: payment.instructor_earning,
          status: 'pending'
        }], { session });
      }
    }

    await session.commitTransaction();
    return payment;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

// POST /api/payments/sslcommerz/success
// SSLCommerz POSTs here with the result. We validate, then redirect
// the user back to the frontend success page.
const sslcommerzSuccess = async (req, res) => {
  const tranId = req.body?.tran_id || req.query?.tran_id;
  const valId = req.body?.val_id || req.query?.val_id;
  const clientBase = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

  try {
    if (!tranId) throw new Error('Missing transaction id.');

    // Validate with SSLCommerz before trusting the success POST
    if (valId && isConfigured()) {
      const validateUrl = `${SSL_BASE()}/validator/api/validationserverAPI.php`;
      const r = await axios.get(validateUrl, {
        params: {
          val_id: valId,
          store_id: process.env.SSLCOMMERZ_STORE_ID,
          store_passwd: process.env.SSLCOMMERZ_STORE_PASS,
          format: 'json'
        }
      });

      const status = r.data?.status;
      if (status !== 'VALID' && status !== 'VALIDATED') {
        throw new Error(`Validation status was ${status}.`);
      }
    }

    const payment = await finalizeSuccessfulPayment(tranId);
    return res.redirect(`${clientBase}/payment/success?course_id=${payment.course_id}&tran=${tranId}`);
  } catch (error) {
    logger.error('SSLCommerz success handler error:', error.message);
    return res.redirect(`${clientBase}/payment/failed?reason=${encodeURIComponent(error.message)}`);
  }
};

// POST /api/payments/sslcommerz/fail
const sslcommerzFail = async (req, res) => {
  const tranId = req.body?.tran_id || req.query?.tran_id;
  const clientBase = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

  try {
    if (tranId) {
      await Payment.findOneAndUpdate(
        { transaction_id: tranId },
        { status: 'failed' }
      );
    }
  } catch (e) {
    logger.error('SSLCommerz fail handler error:', e.message);
  }
  return res.redirect(`${clientBase}/payment/failed?reason=${encodeURIComponent('Payment failed at gateway.')}`);
};

// POST /api/payments/sslcommerz/cancel
const sslcommerzCancel = async (req, res) => {
  const tranId = req.body?.tran_id || req.query?.tran_id;
  const clientBase = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  try {
    if (tranId) {
      await Payment.findOneAndUpdate(
        { transaction_id: tranId },
        { status: 'failed' }
      );
    }
  } catch (e) {
    logger.error('SSLCommerz cancel handler error:', e.message);
  }
  return res.redirect(`${clientBase}/payment/failed?reason=${encodeURIComponent('Payment cancelled.')}`);
};

// POST /api/payments/sslcommerz/ipn
// Backup notification from SSLCommerz in case the redirect fails
const sslcommerzIpn = async (req, res) => {
  try {
    const tranId = req.body?.tran_id;
    if (tranId && req.body?.status === 'VALID') {
      await finalizeSuccessfulPayment(tranId);
    }
    res.status(200).send('OK');
  } catch (e) {
    logger.error('SSLCommerz IPN error:', e.message);
    res.status(200).send('OK'); // Always 200 so SSL doesn't keep retrying
  }
};

module.exports = {
  initSslcommerz,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  sslcommerzIpn,
  isConfigured
};
