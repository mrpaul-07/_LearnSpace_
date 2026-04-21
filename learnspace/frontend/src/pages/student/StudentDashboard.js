// ============================================================
// LearnSpace - Student Dashboard
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import api, { certAPI, courseAPI } from '../../services/api';
import { StatCard, ProgressBar, CourseCard, Loader, EmptyState } from '../../components/common/UI';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/my'),
      certAPI.getMine(),
      courseAPI.getRecommendations({ limit: 4 })
    ]).then(([enrRes, certRes, recRes]) => {
      setEnrollments(enrRes.data.data.enrollments || []);
      setCertificates(certRes.data.data.certificates || []);
      setRecommendations(recRes.data?.data?.recommendations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completedCourses = enrollments.filter(e => parseFloat(e.progress_percent) >= 100).length;
  const inProgressCourses = enrollments.filter(e => parseFloat(e.progress_percent) < 100 && parseFloat(e.progress_percent) > 0).length;

  if (loading) return <Loader size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Enrolled Courses"
          value={enrollments.length}
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard
          title="In Progress"
          value={inProgressCourses}
          color="yellow"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Completed"
          value={completedCourses}
          color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Certificates"
          value={certificates.length}
          color="purple"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
            <Link to="/my-courses" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState
              title="No courses yet"
              description="Browse our course marketplace and enroll in your first course!"
              action={
                <Link to="/courses" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Browse Courses
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {enrollments.slice(0, 4).map(enrollment => {
                // Backend populates as course_id (the FK field name)
                const course = enrollment.course_id || enrollment.course || {};
                const courseId = course?._id || course?.id || enrollment.course_id || '';
                return (
                <div key={enrollment._id || enrollment.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 hover:shadow-sm transition-shadow">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {course?.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-blue-400 text-xl">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{course?.title || 'Untitled Course'}</h3>
                    <div className="mt-2 mb-1">
                      <ProgressBar percent={enrollment.progress_percent} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{Math.round(enrollment.progress_percent)}% complete</span>
                      <Link
                        to={`/learn/${courseId}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {parseFloat(enrollment.progress_percent) > 0 ? 'Continue →' : 'Start →'}
                      </Link>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Certificates */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">My Certificates</h3>
              <Link to="/certificates" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            {certificates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Complete a course to earn your first certificate!</p>
            ) : (
              <div className="space-y-3">
                {certificates.slice(0, 3).map(cert => {
                  const certCourse = cert.course_id || cert.course || {};
                  return (
                  <div key={cert._id || cert.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm">🏆</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{certCourse?.title || 'Course'}</p>
                      <p className="text-xs text-gray-400">{new Date(cert.issued_at).toLocaleDateString()}</p>
                    </div>
                    {cert.pdf_url && (
                      <a href={cert.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 shrink-0">PDF</a>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-2">Explore More Courses</h3>
            <p className="text-blue-200 text-xs mb-4">Discover new skills and advance your career.</p>
            <Link
              to="/courses"
              className="block text-center bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended for you */}
      {recommendations.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recommended for you ✨</h2>
              <p className="text-xs text-gray-500 mt-0.5">Based on your interests and what's popular right now</p>
            </div>
            <Link to="/courses" className="text-sm text-blue-600 hover:underline shrink-0">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map(course => (
              <CourseCard key={course._id || course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
