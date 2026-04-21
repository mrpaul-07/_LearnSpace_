// ============================================================
// LearnSpace - Course Detail Page
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import { Loader, Badge } from '../components/common/UI';
import CourseReviews from '../components/common/CourseReviews';
import { toast } from 'react-toastify';

// Helper: MongoDB _id ba regular id
const getId = (obj) => obj?._id || obj?.id || '';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // id jodi invalid hoy, API call kora amon ki — direct error dekhao
    if (!id || id === 'undefined' || id === 'null') {
      toast.error('Invalid course ID.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    courseAPI.getOne(id)
      .then(res => {
        if (cancelled) return;
        console.log('📖 Course detail response:', res.data);
        setCourse(res.data.data.course);
        setIsEnrolled(res.data.data.isEnrolled);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('❌ Course fetch error:', err.response?.status, err.response?.data);
        toast.error(err.response?.data?.message || 'Course not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const courseId = getId(course);
  // Backend populates instructor_id ebong category_id hishebe
  const instructor = course?.instructor_id || course?.instructor || null;
  const category = course?.category_id || course?.category || null;

  const handleEnroll = () => {
    if (!token) return navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
    if (user?.role !== 'student') return toast.info('Only students can enroll in courses.');
    navigate(`/payment/${courseId || id}`);
  };

  const totalDuration = course?.lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0;
  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return <Loader size="lg" />;
  if (!course) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
      <Link to="/courses" className="text-blue-600 mt-4 block hover:underline">← Back to Marketplace</Link>
    </div>
  );

  const discountedPrice = course.discount_price && parseFloat(course.discount_price) < parseFloat(course.price);
  const finalPrice = discountedPrice ? course.discount_price : course.price;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {category?.name && <Badge label={category.name} color="blue" />}
              <Badge label={course.level?.replace('_', ' ') || 'All Levels'} color="gray" />
              <Badge label={course.language === 'bn' ? 'বাংলা' : course.language === 'both' ? 'EN + BN' : 'English'} color="purple" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
            <p className="text-gray-300 text-base mb-5 line-clamp-3">{course.short_description || course.description}</p>

            <div className="flex items-center gap-4 flex-wrap text-sm text-gray-300 mb-4">
              <span className="flex items-center gap-1">
                ⭐ <span className="font-semibold text-yellow-400">{parseFloat(course.avg_rating || 0).toFixed(1)}</span>
                <span className="text-gray-400">({course.total_reviews || 0} reviews)</span>
              </span>
              <span>👥 {(course.total_enrollments || 0).toLocaleString()} students</span>
              <span>📚 {course.total_lessons || 0} lessons</span>
              <span>⏱ {formatDuration(totalDuration)}</span>
            </div>

            {instructor?.name && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold">
                  {instructor.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-300">by <span className="text-white font-medium">{instructor.name}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* What You'll Learn */}
            {course.what_you_learn?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">What You'll Learn</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {course.what_you_learn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Requirements</h2>
                <ul className="space-y-1">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-gray-400 mt-0.5 shrink-0">•</span> {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            {course.lessons?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Course Curriculum</h2>
                  <span className="text-sm text-gray-500">{course.total_lessons || course.lessons.length} lessons · {formatDuration(totalDuration)}</span>
                </div>
                <div className="space-y-2">
                  {course.lessons.map((lesson, idx) => (
                    <div
                      key={getId(lesson) || idx}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs shrink-0">
                          {lesson.type === 'video' ? '▶' : lesson.type === 'quiz' ? '📝' : lesson.type === 'document' ? '📄' : '📌'}
                        </div>
                        <div>
                          <span className="text-sm text-gray-800">{lesson.title}</span>
                          {lesson.is_preview && (
                            <Badge label="Preview" color="green" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.is_preview && isEnrolled === false && (
                          <button className="text-xs text-blue-600 hover:underline">Preview</button>
                        )}
                        {lesson.duration > 0 && (
                          <span className="text-xs text-gray-400">{formatDuration(lesson.duration)}</span>
                        )}
                        {!isEnrolled && !lesson.is_preview && (
                          <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About This Course</h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </div>

            {/* Reviews */}
            <CourseReviews courseId={courseId || id} isEnrolled={isEnrolled} />
          </div>

          {/* Sticky Enroll Card */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
              {/* Preview Video or Thumbnail */}
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  {course.is_free || parseFloat(finalPrice) === 0 ? (
                    <span className="text-3xl font-bold text-green-600">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">৳{finalPrice}</span>
                      {discountedPrice && (
                        <span className="text-base text-gray-400 line-through">৳{course.price}</span>
                      )}
                      {discountedPrice && (
                        <span className="text-sm font-semibold text-red-500">
                          {Math.round((1 - parseFloat(course.discount_price) / parseFloat(course.price)) * 100)}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Action Button */}
                {isEnrolled ? (
                  <Link
                    to={`/learn/${courseId}`}
                    className="block w-full bg-green-600 text-white py-3 rounded-xl text-center font-semibold text-sm hover:bg-green-700 transition-colors"
                  >
                    Continue Learning →
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    {course.is_free || parseFloat(finalPrice) === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </button>
                )}

                {!isEnrolled && (
                  <p className="text-xs text-center text-gray-400 mt-2">30-day money-back guarantee</p>
                )}

                {/* Course Includes */}
                <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">This course includes:</p>
                  {[
                    { icon: '▶', text: `${course.total_lessons || 0} video lessons` },
                    { icon: '⏱', text: `${formatDuration(totalDuration)} total content` },
                    { icon: '📱', text: 'Access on all devices' },
                    { icon: '♾', text: 'Full lifetime access' },
                    { icon: '🏆', text: 'Certificate of completion' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{item.icon}</span> {item.text}
                    </div>
                  ))}
                </div>

                {/* Share */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3 justify-center">
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    🔗 Share this course
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
