// ============================================================
// LearnSpace - Payment Page (Fixed - works without API keys)
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, paymentAPI } from '../../services/api';
import { Loader } from '../../components/common/UI';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState('demo');

  useEffect(() => {
    courseAPI.getOne(courseId)
      .then(res => setCourse(res.data.data.course))
      .catch(() => { toast.error('Course not found'); navigate('/courses'); })
      .finally(() => setLoading(false));
  }, [courseId, navigate]);

  const handleFreeEnroll = async () => {
    setProcessing(true);
    try {
      const res = await paymentAPI.createOrder({ course_id: courseId, gateway: 'free' });
      if (res?.data?.already_enrolled) {
        toast.info('You are already enrolled. Redirecting to your course…');
      } else {
        toast.success('Enrolled successfully!');
      }
      navigate(`/learn/${courseId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDemoPayment = async () => {
    setProcessing(true);
    try {
      const res = await paymentAPI.createOrder({ course_id: courseId, gateway: 'demo' });
      if (res?.data?.already_enrolled) {
        toast.info('You are already enrolled. Redirecting to your course…');
      } else {
        toast.success('🎉 Payment successful! You are now enrolled.');
      }
      navigate(`/learn/${courseId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSslcommerz = async () => {
    setProcessing(true);
    try {
      const res = await paymentAPI.initSslcommerz({ course_id: courseId });
      if (res?.data?.already_enrolled) {
        toast.info('You are already enrolled. Redirecting to your course…');
        navigate(`/learn/${courseId}`);
        return;
      }
      const url = res?.data?.data?.redirect_url;
      if (!url) throw new Error('No redirect URL returned');
      // Hand off to SSLCommerz hosted gateway
      window.location.href = url;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'SSLCommerz init failed.';
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (loading) return <Loader />;
  if (!course) return null;

  const price = parseFloat(course.discount_price || course.price);
  const isFree = course.is_free || price === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Secure Checkout</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-3 space-y-5">

          {isFree ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Free Course</h2>
              <p className="text-gray-500 text-sm mb-5">This course is completely free. Click below to enroll instantly.</p>
              <button
                onClick={handleFreeEnroll}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {processing ? 'Enrolling...' : 'Enroll for Free'}
              </button>
            </div>
          ) : (
            <>
              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'demo', icon: '🧪', label: 'Demo Pay', sub: 'For testing' },
                    { id: 'stripe', icon: '💳', label: 'Card/Stripe', sub: 'Visa, Mastercard' },
                    { id: 'sslcommerz', icon: '📱', label: 'SSLCommerz', sub: 'bKash, Nagad' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setGateway(m.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${gateway === m.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{m.label}</span>
                      <span className="text-xs text-gray-400">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Payment */}
              {gateway === 'demo' && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">🧪 Demo Mode</p>
                    <p className="text-xs text-yellow-700">This is a test environment. Click the button below to simulate a successful payment and get enrolled immediately.</p>
                  </div>
                  <button
                    onClick={handleDemoPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Processing...' : `🧪 Demo Pay ৳${price.toLocaleString()}`}
                  </button>
                </div>
              )}

              {/* Stripe (requires API key) */}
              {gateway === 'stripe' && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Stripe Not Configured</p>
                    <p className="text-xs text-red-600">To enable Stripe payments, add your <strong>REACT_APP_STRIPE_PUBLIC_KEY</strong> to the frontend <strong>.env</strong> file and <strong>STRIPE_SECRET_KEY</strong> to the backend <strong>.env</strong> file.</p>
                    <p className="text-xs text-red-500 mt-2">For now, use <strong>Demo Pay</strong> to test enrollment.</p>
                  </div>
                </div>
              )}

              {/* SSLCommerz - real payment (sandbox or live) */}
              {gateway === 'sslcommerz' && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-800 mb-1">💳 SSLCommerz Payment</p>
                    <p className="text-xs text-blue-700">
                      You'll be redirected to SSLCommerz to complete payment via bKash, Nagad, Rocket, or any local card. You'll come back to LearnSpace automatically when done.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      <strong>Note:</strong> Requires <code>SSLCOMMERZ_STORE_ID</code> and <code>SSLCOMMERZ_STORE_PASS</code> in the backend <code>.env</code> file. If not configured, you'll see a clear error message — use Demo Pay to test enrollment in the meantime.
                    </p>
                  </div>
                  <button
                    onClick={handleSslcommerz}
                    disabled={processing}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Redirecting…' : `Pay ৳${price.toLocaleString()} via SSLCommerz →`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Summary</h3>

            <div className="flex gap-3 mb-5 pb-5 border-b border-gray-50">
              <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {course.thumbnail
                  ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-blue-100 flex items-center justify-center text-xl">📚</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{course.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">by {(course.instructor_id || course.instructor)?.name || 'Instructor'}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Original Price</span>
                <span>৳{parseFloat(course.price).toLocaleString()}</span>
              </div>
              {course.discount_price && parseFloat(course.discount_price) < parseFloat(course.price) && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳{(parseFloat(course.price) - parseFloat(course.discount_price)).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-50">
                <span>Total</span>
                <span>{isFree ? 'Free' : `৳${price.toLocaleString()}`}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-1">✓ Full lifetime access</div>
              <div className="flex items-center gap-1">✓ Certificate of completion</div>
              <div className="flex items-center gap-1">✓ 30-day money-back guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
