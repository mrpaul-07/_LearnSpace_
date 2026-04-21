// ============================================================
// LearnSpace - Instructor Analytics
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { courseAPI } from '../../services/api';
import { Loader, EmptyState, Badge, ProgressBar } from '../../components/common/UI';

const BarChart = ({ data, valueKey = 'value', labelKey = 'label', unit = '৳' }) => {
  const max = Math.max(1, ...data.map(d => Number(d[valueKey]) || 0));
  if (data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">No data yet.</p>;
  }
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 text-xs text-gray-500 shrink-0">{d[labelKey]}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="w-24 text-xs font-medium text-gray-700 text-right shrink-0">
              {unit}{Math.round(v).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const InstructorAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/analytics/instructor'),
      courseAPI.getMine({ limit: 50 })
    ])
      .then(([anaRes, crsRes]) => {
        if (cancelled) return;
        setAnalytics(anaRes.data?.data || {});
        setCourses(crsRes.data?.data?.courses || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const earningsChart = useMemo(() => {
    const list = analytics?.earningsByMonth || [];
    return list.map(item => ({ label: item.month, value: item.earning || 0 }));
  }, [analytics]);

  const stats = analytics?.stats || {};

  if (loading) return <Loader size="lg" />;

  const totalEnrollmentsAcrossCourses = courses.reduce((acc, c) => acc + (c.total_enrollments || 0), 0);
  const publishedCount = courses.filter(c => c.status === 'published').length;
  const draftCount = courses.filter(c => c.status === 'draft' || c.status === 'pending_review').length;

  const fmt = (n) => `৳${Math.round(n || 0).toLocaleString()}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Student engagement, enrollments, and earnings across your courses.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">{fmt(stats.totalEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">After 30% platform fee</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Active Enrollments</p>
          <p className="text-2xl font-bold text-blue-600">{(stats.totalEnrollments || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Published Courses</p>
          <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
          {draftCount > 0 && <p className="text-xs text-yellow-600 mt-1">{draftCount} in draft / review</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Average Rating</p>
          <p className="text-2xl font-bold text-yellow-500">
            {parseFloat(stats.avgRating || 0).toFixed(1)} ⭐
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all courses</p>
        </div>
      </div>

      {/* Earnings trend */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Earnings — last 6 months</h2>
        {earningsChart.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">📊</span>}
            title="No earnings yet"
            description="Earnings will appear here as students enroll in your paid courses."
          />
        ) : (
          <BarChart data={earningsChart} unit="৳" />
        )}
      </div>

      {/* Course performance table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Course Performance</h2>
          <p className="text-xs text-gray-400">{totalEnrollmentsAcrossCourses.toLocaleString()} total students</p>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl">🎓</span>}
            title="No courses yet"
            description="Create your first course to start earning."
            action={
              <Link to="/instructor/courses/create" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                Create Course
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {courses.map(c => {
              const pct = totalEnrollmentsAcrossCourses > 0
                ? ((c.total_enrollments || 0) / totalEnrollmentsAcrossCourses) * 100
                : 0;
              const statusColor =
                c.status === 'published' ? 'green' :
                c.status === 'pending_review' ? 'yellow' :
                c.status === 'rejected' ? 'red' : 'gray';
              return (
                <div key={c._id || c.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link to={`/instructor/courses/${c._id || c.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate block">
                        {c.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge label={c.status?.replace('_', ' ') || 'draft'} color={statusColor} />
                        <span className="text-xs text-gray-400">{c.is_free ? 'Free' : `৳${c.price}`}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{c.total_lessons || 0} lessons</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{(c.total_enrollments || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">students</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Share of total enrollments</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <ProgressBar percent={pct} showLabel={false} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAnalyticsPage;
