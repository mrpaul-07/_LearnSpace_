// ============================================================
// LearnSpace - Forgot Password Page
// ============================================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-4">If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.</p>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">← Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;


// ============================================================
// LearnSpace - Reset Password Page
// ============================================================
export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min 8 characters" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required placeholder="Re-enter password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Stub pages for completeness (expandable) ───────────────
import { useParams, useNavigate } from 'react-router-dom';

export const PaymentSuccessPageStub = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 text-sm mb-6">You are now enrolled. Start learning!</p>
        <Link to="/my-courses" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
          Go to My Courses →
        </Link>
      </div>
    </div>
  );
};

export const AdminPaymentsPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Monitoring</h1>
    <p className="text-gray-500 text-sm">Payment history and financial oversight.</p>
    {/* Full implementation mirrors AdminDashboard recent transactions table */}
  </div>
);

export const AdminReportsPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
    <p className="text-gray-500 text-sm">Revenue, user growth, and platform performance reports.</p>
  </div>
);

export const EarningsPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Earnings</h1>
    <p className="text-gray-500 text-sm">Revenue from your courses and payout requests.</p>
  </div>
);

export const InstructorAnalyticsPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Analytics</h1>
    <p className="text-gray-500 text-sm">Student engagement, completion rates, and ratings.</p>
  </div>
);

export const EditCoursePage = () => (
  <div className="max-w-3xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Course</h1>
    <p className="text-gray-500 text-sm">Same form as CreateCoursePage, pre-filled with existing course data.</p>
  </div>
);
