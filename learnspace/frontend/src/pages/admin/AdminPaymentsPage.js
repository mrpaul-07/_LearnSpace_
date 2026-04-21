// ============================================================
// LearnSpace - Admin Payments / Transaction Monitoring
// ============================================================
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader, Badge, EmptyState } from '../../components/common/UI';

const AdminPaymentsPage = () => {
  const [report, setReport] = useState({
    totalRevenue: 0,
    platformRevenue: 0,
    instructorRevenue: 0,
    byGateway: [],
    topCourses: []
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/admin/reports/revenue'),
      api.get('/admin/dashboard')
    ])
      .then(([revRes, dashRes]) => {
        if (cancelled) return;
        const r = revRes.data?.data || {};
        setReport({
          totalRevenue: r.totalRevenue || 0,
          platformRevenue: r.platformRevenue || 0,
          instructorRevenue: r.instructorRevenue || 0,
          byGateway: Array.isArray(r.byGateway) ? r.byGateway : [],
          topCourses: Array.isArray(r.topCourses) ? r.topCourses : []
        });
        setRecentPayments(dashRes.data?.data?.recentPayments || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader size="lg" />;

  const fmt = (n) => `৳${Math.round(n || 0).toLocaleString()}`;
  const platformPct = report.totalRevenue > 0
    ? Math.round((report.platformRevenue / report.totalRevenue) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction & Payment Monitoring</h1>
      <p className="text-gray-500 text-sm mb-6">
        Platform-wide revenue and payment activity. Platform takes a {platformPct}% share.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">{fmt(report.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Gross from all completed payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Instructor Earnings</p>
          <p className="text-2xl font-bold text-green-600">{fmt(report.instructorRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">70% revenue share</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Platform Revenue</p>
          <p className="text-2xl font-bold text-purple-600">{fmt(report.platformRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">30% platform fee</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {recentPayments.length === 0 ? (
            <EmptyState
              icon={<span className="text-3xl">💳</span>}
              title="No transactions yet"
              description="Once students start enrolling in paid courses, transactions will appear here."
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left font-medium px-5 py-2">Student</th>
                    <th className="text-left font-medium py-2">Course</th>
                    <th className="text-left font-medium py-2">Gateway</th>
                    <th className="text-right font-medium px-5 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map(p => {
                    const student = p.student_id || {};
                    const course = p.course_id || {};
                    return (
                      <tr key={p._id || p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 text-sm">{student.name || '—'}</p>
                          <p className="text-xs text-gray-400">{student.email || ''}</p>
                        </td>
                        <td className="py-3 text-gray-700">{course.title || 'Course'}</td>
                        <td className="py-3">
                          <Badge label={p.gateway || 'free'} color={p.gateway === 'free' ? 'gray' : 'blue'} />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {fmt(p.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* By gateway */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By Gateway</h2>
            {report.byGateway.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No gateway data yet.</p>
            ) : (
              <div className="space-y-3">
                {report.byGateway.map(g => (
                  <div key={g._id || 'free'} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">{g._id || 'free'}</span>
                    <span className="text-sm font-semibold text-gray-900">{fmt(g.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top earning courses */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Courses by Enrollment</h2>
            {report.topCourses.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No courses yet.</p>
            ) : (
              <div className="space-y-3">
                {report.topCourses.slice(0, 5).map(c => (
                  <div key={c._id || c.id} className="flex justify-between gap-3">
                    <p className="text-sm text-gray-700 truncate flex-1">{c.title}</p>
                    <span className="text-xs text-gray-500 shrink-0">{c.total_enrollments || 0} enrolled</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
