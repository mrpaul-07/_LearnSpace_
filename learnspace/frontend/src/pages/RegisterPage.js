import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../context/authStore';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', role: 'student', language: 'en' });
  const [showPass, setShowPass] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match.');
    const { confirm_password, ...data } = form;
    const result = await register(data);
    if (result.success) {
      toast.success('Account created successfully!');
      const map = { admin: '/admin/dashboard', instructor: '/instructor/dashboard', student: '/dashboard' };
      navigate(map[data.role] || '/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">LS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">Join LearnSpace today — it's free</p>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['student', 'instructor'].map(r => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.role === r ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                {r === 'student' ? 'Student' : 'Instructor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your full name" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min 8 characters" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{showPass ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required placeholder="Re-enter your password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="en">English</option>
                <option value="bn">বাংলা (Bangla)</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {form.role === 'instructor' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-700">
              ⚠️ Instructor accounts require admin verification before you can publish courses.
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
