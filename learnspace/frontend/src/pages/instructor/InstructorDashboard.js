// ============================================================
// LearnSpace - Instructor Dashboard
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api, { courseAPI, resolveEntityId } from '../../services/api';
import {
  StatCard, Badge, Loader, EmptyState
} from '../../components/common/UI';
import { toast } from 'react-toastify';

const STATUS_COLORS = {
  draft: 'gray',
  pending_review: 'yellow',
  published: 'green',
  rejected: 'red',
  archived: 'gray'
};

const getCourseId = (course) => resolveEntityId(course);

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState({ totalEarnings: 0, totalEnrollments: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [coursesRes, analyticsRes, meRes] = await Promise.all([
          courseAPI.getMine({ limit: 20 }),
          api.get('/analytics/instructor'),
          api.get('/auth/me')
        ]);

        setCourses(coursesRes.data?.data?.courses || []);

        const analytics = analyticsRes.data?.data || {};
        setStats(analytics.stats || {});
        setEarnings(analytics.earningsByMonth || []);
        setVerificationStatus(
          meRes.data?.data?.instructor_profile?.verification_status
            || meRes.data?.data?.user?.instructor_status
            || 'pending'
        );
      } catch (error) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleSubmitCourse = async (course) => {
    const courseId = getCourseId(course);

    if (!courseId) {
      toast.error('Missing course ID. Please refresh and try again.');
      return;
    }

    try {
      await courseAPI.submit(courseId);
      toast.success('Course submitted for admin review!');
      setCourses((prev) => prev.map((item) => (
        getCourseId(item) === courseId
          ? { ...item, status: 'pending_review' }
          : item
      )));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed.');
    }
  };

  if (loading) return <Loader size="lg" />;

  if (verificationStatus !== 'verified') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {verificationStatus === 'pending' ? 'Verification Pending' : 'Verification Required'}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {verificationStatus === 'pending'
              ? 'Your instructor application is under review. Our admin team will verify your credentials within 24-48 hours.'
              : 'Your application was not approved. Please review the feedback and reapply.'}
          </p>
          {verificationStatus !== 'pending' && (
            <Link
              to="/instructor/apply"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Reapply Now
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your courses and track performance</p>
        </div>
        <Link
          to="/instructor/courses/create"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Course
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Earnings"
          value={`৳${(stats.totalEarnings || 0).toLocaleString()}`}
          color="green"
          icon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        />
        <StatCard
          title="Total Students"
          value={(stats.totalEnrollments || 0).toLocaleString()}
          color="blue"
          icon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        />
        <StatCard
          title="Published Courses"
          value={courses.filter((course) => course.status === 'published').length}
          color="purple"
          icon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        />
        <StatCard
          title="Avg. Rating"
          value={`${parseFloat(stats.avgRating || 0).toFixed(1)} ⭐`}
          color="yellow"
          icon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        />
      </div>

      {earnings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={earnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `৳${value}`} />
              <Tooltip formatter={(value) => [`৳${value}`, 'Earnings']} />
              <Line type="monotone" dataKey="earning" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
          <Link to="/instructor/courses/create" className="text-sm text-blue-600 hover:underline">+ New Course</Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Create your first course and start sharing your knowledge."
            action={(
              <Link
                to="/instructor/courses/create"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create First Course
              </Link>
            )}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Students</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((course) => {
                  const courseId = getCourseId(course);

                  return (
                    <tr key={courseId || course.title} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-blue-100 flex items-center justify-center text-sm">📚</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                            <p className="text-xs text-gray-400 capitalize">{course.level?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          label={(course.status || 'draft').replace('_', ' ')}
                          color={STATUS_COLORS[course.status] || 'gray'}
                        />
                      </td>

                      <td className="px-4 py-4 text-gray-600">{course.total_enrollments || 0}</td>

                      <td className="px-4 py-4 font-medium text-gray-900">
                        {course.is_free ? 'Free' : `৳${course.price}`}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {courseId ? (
                            <>
                              <Link to={`/instructor/courses/${courseId}/edit`} className="text-xs text-blue-600 hover:underline">
                                Edit
                              </Link>
                              <Link to={`/instructor/courses/${courseId}/lessons`} className="text-xs text-blue-600 hover:underline">
                                Lessons
                              </Link>
                              {course.status === 'draft' && (
                                <button
                                  type="button"
                                  onClick={() => handleSubmitCourse(course)}
                                  className="text-xs text-green-600 hover:underline"
                                >
                                  Submit
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-red-500">Missing course ID</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
