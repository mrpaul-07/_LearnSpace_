const express = require('express');
const router = express.Router();
const { createOrder, confirmStripePayment, stripeWebhook, getPaymentHistory, processRefund } = require('../controllers/payment.controller');
const {
  initSslcommerz, sslcommerzSuccess, sslcommerzFail, sslcommerzCancel, sslcommerzIpn, isConfigured
} = require('../controllers/sslcommerz.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Stripe webhook (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Demo / free enroll
router.post('/create-order', protect, createOrder);
router.post('/stripe/confirm', protect, confirmStripePayment);

// SSLCommerz (real-money sandbox or live)
router.get('/sslcommerz/status', (req, res) => {
  res.json({ success: true, data: { configured: isConfigured() } });
});
router.post('/sslcommerz/init', protect, initSslcommerz);

// SSLCommerz callbacks - public, urlencoded form bodies. The global json/urlencoded
// middleware in server.js already handles them.
router.post('/sslcommerz/success', sslcommerzSuccess);
router.post('/sslcommerz/fail',    sslcommerzFail);
router.post('/sslcommerz/cancel',  sslcommerzCancel);
router.post('/sslcommerz/ipn',     sslcommerzIpn);

// Some browsers may follow with GET — accept it too
router.get('/sslcommerz/success', sslcommerzSuccess);
router.get('/sslcommerz/fail',    sslcommerzFail);
router.get('/sslcommerz/cancel',  sslcommerzCancel);

// History + refunds
router.get('/history', protect, getPaymentHistory);
router.post('/refund/:paymentId', protect, authorize('admin'), processRefund);

module.exports = router;
