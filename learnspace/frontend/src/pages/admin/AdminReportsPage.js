// ============================================================
// LearnSpace - Admin Reports & Analytics
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Loader, EmptyState, Badge } from '../../components/common/UI';

// Lightweight inline bar chart (no external dependency required)
const BarChart = ({ data, valueKey = 'value', labelKey = 'label', color = 'bg-blue-500' }) => {
  const max = Math.max(1, ...data.map(d => Number(d[valueKey]) || 0));
  if (data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">No data in this range.</p>;
  }
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-16 text-xs text-gray-500 shrink-0">{d[labelKey]}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <div className="w-24 text-xs font-medium text-gray-700 text-right shrink-0">
              ৳{Math.round(v).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const monthLabel = (m) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[(m || 1) - 1] || '?';
};

const AdminReportsPage = () => {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fmtDate = (d) => d.toISOString().slice(0, 10);

  const [from, setFrom] = useState(fmtDate(monthAgo));
  const [to, setTo] = useState(fmtDate(today));

  const [report, setReport] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [platform30d, setPlatform30d] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = (qfrom, qto) => {
    setLoading(true);
    const params = {};
    if (qfrom) params.from = qfrom;
    if (qto) params.to = qto;

    Promise.all([
      api.get('/admin/reports/revenue', { params }),
      api.get('/admin/dashboard'),
      api.get('/analytics/platform').catch(() => null)
    ])
      .then(([revRes, dashRes, platRes]) => {
        setReport(revRes.data?.data || {});
        setDashboard(dashRes.data?.data || {});
        if (platRes) setPlatform30d(platRes.data?.data || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(from, to); /* eslint-disable-next-line */ }, []);

  const revenueByMonth = useMemo(() => {
    const list = dashboard?.revenueByMonth || [];
    return list.map(item => ({
      label: `${monthLabel(item._id?.month)} '${String(item._id?.year || '').slice(-2)}`,
      value: item.total || 0
    }));
  }, [dashboard]);

  const gatewayChart = useMemo(() => {
    const list = report?.byGateway || [];
    return list.map(g => ({ label: (g._id || 'free').toUpperCase(), value: g.total || 0 }));
  }, [report]);

  const stats = dashboard?.stats || {};

  if (loading) return <Loader size="lg" />;

  const fmt = (n) => `৳${Math.round(n || 0).toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide performance, growth, and revenue.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <button onClick={() => fetchAll(from, to)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Apply
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{(stats.totalUsers || 0).toLocaleString()}</p>
          {platform30d && <p className="text-xs text-green-600 mt-1">+{platform30d.newUsers} this month</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Published Courses</p>
          <p className="text-2xl font-bold text-gray-900">{(stats.totalCourses || 0).toLocaleString()}</p>
          {platform30d && <p className="text-xs text-green-600 mt-1">+{platform30d.newCourses} this month</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Active Enrollments</p>
          <p className="text-2xl font-bold text-gray-900">{(stats.totalEnrollments || 0).toLocaleString()}</p>
          {platform30d && <p className="text-xs text-green-600 mt-1">+{platform30d.newEnrollments} this month</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Revenue (range)</p>
          <p className="text-2xl font-bold text-blue-600">{fmt(report?.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">All gateways combined</p>
        </div>
      </div>

      {/* Revenue split */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue Split (selected range)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Instructor Earnings (70%)</span>
                <span className="font-semibold text-green-600">{fmt(report?.instructorRevenue)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Platform Revenue (30%)</span>
                <span className="font-semibold text-purple-600">{fmt(report?.platformRevenue)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '30%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Gateway</h2>
          <BarChart data={gatewayChart} color="bg-blue-500" />
        </div>
      </div>

      {/* Monthly trend + Top courses */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend (last 6 months)</h2>
          {revenueByMonth.length === 0 ? (
            <EmptyState icon={<span className="text-3xl">📈</span>} title="No revenue yet" description="Revenue will appear once payments are completed." />
          ) : (
            <BarChart data={revenueByMonth} color="bg-indigo-500" />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Performing Courses</h2>
          {(report?.topCourses || []).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No courses yet.</p>
          ) : (
            <div className="space-y-3">
              {report.topCourses.slice(0, 8).map((c, i) => (
                <div key={c._id || c.id || i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{c.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">{c.total_enrollments || 0} enrollments · {c.is_free ? 'Free' : `৳${c.price}`}</p>
                  </div>
                  <Badge label={`${c.total_enrollments || 0}`} color="blue" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
