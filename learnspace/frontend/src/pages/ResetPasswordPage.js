import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ResetPasswordPage = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
