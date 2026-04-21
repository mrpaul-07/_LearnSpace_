// ============================================================
// LearnSpace - MyCoursesPage (Fixed)
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Helper: MongoDB _id ba regular id
const getId = (obj) => obj?._id || obj?.id || '';

const CourseThumbnail = ({ src, title }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
        <span className="text-white text-4xl">📚</span>
      </div>
    );
  }
  return <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} />;
};

const ProgressBar = ({ percent = 0 }) => (
  <div className="w-full bg-gray-100 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, parseFloat(percent) || 0))}%` }}
    />
  </div>
);

const MyCoursesPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        const res = await api.get('/enrollments/my');
        const raw = res.data?.data?.enrollments || [];

        console.log('📚 Enrollments raw response:', raw);

        const normalised = raw
          .filter(e => !e.status || e.status === 'active')
          .map(e => ({
            id:               getId(e),
            progress_percent: parseFloat(e.progress_percent || 0),
            last_accessed:    e.last_accessed || e.updatedAt || e.enrolled_at,
            completed_at:     e.completed_at,
            enrolled_at:      e.enrolled_at || e.createdAt,
            status:           e.status || 'active',
            // course_id (populated) ba course, jeta thake
            course:           e.course_id || e.course || e.Course || {}
          }));

        console.log('✅ Normalised enrollments:', normalised);
        setEnrollments(normalised);
      } catch (err) {
        console.error('❌ Enrollment fetch error:', err.response?.status, err.response?.data);
        if (err.response?.status === 403) {
          toast.error('Access denied — make sure you are logged in as a student.');
        } else {
          toast.error('Failed to load your courses.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolled();
  }, []);

  const filtered = enrollments.filter(e => {
    if (filter === 'completed')   return parseFloat(e.progress_percent) >= 100;
    if (filter === 'in-progress') return parseFloat(e.progress_percent) < 100;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          {[
            { id: 'all',         label: 'All' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'completed',   label: 'Completed' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === f.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No courses yet</h2>
          <p className="text-gray-500 mb-6">Start learning by enrolling in a course.</p>
          <Link to="/courses" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">
            Browse Courses →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-500">No courses match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(enrollment => {
            const course   = enrollment.course || {};
            const courseId = getId(course);
            // Backend theke instructor_id populate hoye ase (object)
            const instructor = course.instructor_id || course.instructor || {};
            const percent = parseFloat(enrollment.progress_percent || 0);
            const isDone  = percent >= 100;
            return (
              <div key={enrollment.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <CourseThumbnail src={course.thumbnail} title={course.title} />
                  {isDone && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ✓ Completed
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {course.title || 'Untitled Course'}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">by {instructor.name || 'Instructor'}</p>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{isDone ? '🎉 Completed!' : 'Progress'}</span>
                      <span className="font-medium">{Math.round(percent)}%</span>
                    </div>
                    <ProgressBar percent={percent} />
                  </div>
                  {enrollment.enrolled_at && (
                    <p className="text-xs text-gray-400 mb-3">
                      Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <div className="mt-auto flex gap-2">
                    {courseId ? (
                      <Link to={`/learn/${courseId}`}
                        className="flex-1 text-center bg-blue-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        {percent === 0 ? '▶ Start' : isDone ? '↩ Review' : '▶ Continue'}
                      </Link>
                    ) : (
                      <button disabled className="flex-1 text-center bg-gray-300 text-white text-sm py-2 rounded-lg font-medium cursor-not-allowed">
                        Course unavailable
                      </button>
                    )}
                    {isDone && (
                      <Link to="/certificates" className="px-3 py-2 border border-green-500 text-green-600 text-sm rounded-lg hover:bg-green-50" title="View Certificate">
                        🏆
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
