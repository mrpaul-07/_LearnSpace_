// ============================================================
// LearnSpace - Admin Dashboard
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import { StatCard, Badge, Loader } from '../../components/common/UI';
import { toast } from 'react-toastify';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader size="lg" />;

  const revenueChartData = (data?.revenueByMonth || []).map(r => ({
    name: MONTH_NAMES[(r.dataValues?.month || r.month) - 1],
    revenue: parseFloat(r.dataValues?.total || r.total || 0)
  }));

  const { stats, recentPayments } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Alert Badges */}
      {(stats?.pendingInstructors > 0 || stats?.pendingCourses > 0) && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {stats.pendingInstructors > 0 && (
            <Link to="/admin/instructors" className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 hover:shadow-sm transition-shadow">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-yellow-700">{stats.pendingInstructors} instructor{stats.pendingInstructors > 1 ? 's' : ''} awaiting verification</span>
              <span className="text-yellow-500 text-sm">→</span>
            </Link>
          )}
          {stats.pendingCourses > 0 && (
            <Link to="/admin/courses" className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 hover:shadow-sm transition-shadow">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">{stats.pendingCourses} course{stats.pendingCourses > 1 ? 's' : ''} pending review</span>
              <span className="text-blue-500 text-sm">→</span>
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || 0} color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Published Courses" value={stats?.totalCourses || 0} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard title="Enrollments" value={stats?.totalEnrollments?.toLocaleString() || 0} color="purple"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard title="Total Revenue" value={`৳${(stats?.totalRevenue || 0).toLocaleString()}`} color="yellow"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Pending Instructors" value={stats?.pendingInstructors || 0} color="red"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard title="Pending Courses" value={stats?.pendingCourses || 0} color="yellow"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Overview (Last 6 Months)</h2>
          {revenueChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `৳${v.toLocaleString()}`} />
                <Tooltip formatter={(v) => [`৳${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          {[
            { label: 'Verify Instructors', to: '/admin/instructors', count: stats?.pendingInstructors, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Review Courses', to: '/admin/courses', count: stats?.pendingCourses, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Manage Users', to: '/admin/users', count: null, color: 'bg-gray-50 border-gray-200 text-gray-700' },
            { label: 'Payment Reports', to: '/admin/reports', count: null, color: 'bg-green-50 border-green-200 text-green-700' }
          ].map(item => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center justify-between p-4 rounded-xl border ${item.color} hover:shadow-sm transition-shadow`}
            >
              <span className="text-sm font-medium">{item.label}</span>
              {item.count > 0 && <Badge label={item.count} color="yellow" />}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          <Link to="/admin/payments" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Student</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Course</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Amount</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Gateway</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Status</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentPayments || []).map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-800">{payment.student?.name}</td>
                  <td className="py-3 text-gray-600 truncate max-w-xs">{payment.course?.title}</td>
                  <td className="py-3 font-medium text-gray-900">৳{payment.amount}</td>
                  <td className="py-3 text-gray-500 capitalize">{payment.gateway}</td>
                  <td className="py-3">
                    <Badge
                      label={payment.status}
                      color={payment.status === 'paid' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'}
                    />
                  </td>
                  <td className="py-3 text-gray-400 text-xs">{new Date(payment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!recentPayments?.length && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
