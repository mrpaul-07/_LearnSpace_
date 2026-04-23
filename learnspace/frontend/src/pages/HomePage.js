// ============================================================
// LearnSpace - HomePage (Vintage Deep Green Theme)
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseAPI } from '../services/api';
import { CourseCard, Loader } from '../components/common/UI';
import useAuthStore from '../context/authStore';
import api from '../services/api';

// Decorative sparkle dots that float around the logo
const Sparkles = () => {
  const positions = [
    { top: '10%', left: '15%',  size: 6,  delay: 0 },
    { top: '20%', right: '18%', size: 8,  delay: 0.8 },
    { top: '45%', left: '8%',   size: 5,  delay: 1.4 },
    { top: '65%', right: '12%', size: 7,  delay: 0.3 },
    { top: '5%',  left: '45%',  size: 5,  delay: 2.1 },
    { top: '80%', left: '40%',  size: 6,  delay: 1.0 },
    { bottom: '12%', right: '30%', size: 8, delay: 1.8 },
    { top: '30%', right: '40%', size: 4, delay: 2.5 }
  ];
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          className="sparkle-dot"
          style={{
            width: p.size, height: p.size,
            top: p.top, left: p.left, right: p.right, bottom: p.bottom,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseAPI.getFeatured().catch(() => ({ data: { data: { courses: [] } } })),
      api.get('/categories').catch(() => ({ data: { data: { categories: [] } } }))
    ]).then(([fRes, cRes]) => {
      setFeatured(fRes.data?.data?.courses || []);
      setCategories(cRes.data?.data?.categories || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative background - forest gradient with vintage texture */}
        <div className="absolute inset-0 bg-forest-gradient"></div>
        <div className="absolute inset-0 bg-paper opacity-30"></div>

        {/* Decorative ornamental corners */}
        <div className="absolute top-8 left-8 text-amber-300/30 text-6xl hidden md:block select-none">❦</div>
        <div className="absolute top-8 right-8 text-amber-300/30 text-6xl hidden md:block select-none">❦</div>
        <div className="absolute bottom-8 left-8 text-amber-300/30 text-6xl hidden md:block select-none">❦</div>
        <div className="absolute bottom-8 right-8 text-amber-300/30 text-6xl hidden md:block select-none">❦</div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col items-center text-center">

            {/* Logo with sparkles */}
            <div className="relative inline-block mb-8 animate-float-slow">
              <Sparkles />
              <img
                src="/logo.png"
                alt="LearnSpace"
                className="relative z-10 h-32 md:h-40 w-auto drop-shadow-[0_0_30px_rgba(242,194,82,0.3)]"
              />
            </div>

            {/* Sparkling brand name */}
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 tracking-wider">
              <span className="text-sparkle">LearnSpace</span>
            </h1>

            {/* Latin-style tagline */}
            <div className="vintage-divider mb-6 w-full max-w-md">
              <span className="text-amber-300 text-lg italic font-display">Learn, Earn & Grow</span>
            </div>

            <p className="text-cream-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-sans italic mb-8">
              An open-source learning marketplace where knowledge meets opportunity.
              Study at your own pace, from verified instructors, in English or বাংলা.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/courses"
                className="bg-amber-400 text-forest-900 px-8 py-3.5 rounded-md font-bold text-sm tracking-widest uppercase shadow-xl hover:bg-amber-300 hover:shadow-2xl transition-all"
              >
                Explore Courses
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="bg-transparent border-2 border-cream-100 text-cream-100 px-8 py-3.5 rounded-md font-bold text-sm tracking-widest uppercase hover:bg-cream-100 hover:text-forest-900 transition-all"
                >
                  Begin Your Journey
                </Link>
              )}
              {user?.role === 'student' && (
                <Link
                  to="/dashboard"
                  className="bg-transparent border-2 border-cream-100 text-cream-100 px-8 py-3.5 rounded-md font-bold text-sm tracking-widest uppercase hover:bg-cream-100 hover:text-forest-900 transition-all"
                >
                  Continue Learning
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
      </section>

      {/* ── FEATURE PILLARS ─────────────────────────────── */}
      <section className="py-16 md:py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="ornament text-forest-500 mb-2"></p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-800 mb-3">
              Why LearnSpace?
            </h2>
            <p className="text-forest-600 italic text-lg font-sans">
              Crafted for learners and educators alike
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '📚',
                title: 'Verified Instructors',
                body: 'Every instructor is hand-reviewed by our admins. Teaching credentials and identity are verified before a single course goes live.'
              },
              {
                icon: '🏆',
                title: 'Earn Real Certificates',
                body: 'Complete any course at 100% and receive a verifiable digital certificate, signed by the instructor and valid across the web.'
              },
              {
                icon: '🌐',
                title: 'Bangla & English',
                body: 'Study in your language. Toggle between English and Bangla with one click — UI, courses, and our AI assistant all follow.'
              },
              {
                icon: '💳',
                title: 'Flexible Payment',
                body: 'Pay securely via SSLCommerz (bKash, Nagad, card) or take a free course at no cost. Instructors earn a transparent 70% share.'
              },
              {
                icon: '📹',
                title: 'Live Classes',
                body: 'Join scheduled live sessions over Zoom, Meet, or Jitsi — right from your course page. Interact with instructors in real time.'
              },
              {
                icon: '🤖',
                title: 'Intelligent Assistant',
                body: 'An always-on chatbot answers common questions in English or Bangla, from enrollment help to payment methods and more.'
              }
            ].map((f, i) => (
              <div
                key={i}
                className="card-vintage rounded-lg p-6 hover:shadow-vintage-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-display text-xl font-bold text-forest-800 mb-2">{f.title}</h3>
                <p className="text-forest-600 font-sans leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-forest-50/60 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-800 mb-2">
                Explore by Category
              </h2>
              <div className="vintage-divider max-w-xs mx-auto">
                <span className="text-forest-500 italic">Choose your path</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map(cat => (
                <Link
                  key={cat._id || cat.id}
                  to={`/courses?category=${cat._id || cat.id}`}
                  className="card-vintage rounded-md p-5 text-center hover:bg-forest-100 hover:border-forest-400 transition-all group"
                >
                  <div className="text-3xl mb-2">{cat.icon || '📖'}</div>
                  <p className="font-display font-semibold text-forest-800 group-hover:text-forest-900">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED COURSES ─────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest-800 mb-2">
              Featured Courses
            </h2>
            <div className="vintage-divider max-w-sm mx-auto">
              <span className="text-forest-500 italic">Popular on the platform</span>
            </div>
          </div>

          {loading ? (
            <Loader size="lg" />
          ) : featured.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-forest-600 italic">
                No featured courses yet — be the first to publish one!
              </p>
              {user?.role === 'instructor' && (
                <Link
                  to="/instructor/courses/create"
                  className="inline-block mt-4 bg-forest-700 text-cream-50 px-6 py-2.5 rounded-md font-semibold hover:bg-forest-800 transition-colors"
                >
                  Create a Course
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map(course => (
                <CourseCard key={course._id || course.id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-forest-700 hover:text-forest-900 font-semibold border-b-2 border-forest-400 hover:border-forest-700 pb-1 transition-colors"
            >
              Browse All Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* ── INSTRUCTOR CTA ─────────────────────────────── */}
      <section className="py-16 bg-forest-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-paper opacity-20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="ornament text-amber-300 mb-3"></p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-cream-50 mb-4">
            Share Your Knowledge
          </h2>
          <p className="text-cream-200 font-sans italic text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            Become a LearnSpace instructor. Create courses, teach students across Bangladesh and beyond,
            and earn a transparent 70% share of every enrollment.
          </p>
          <Link
            to="/register"
            className="inline-block bg-amber-400 text-forest-900 px-8 py-3 rounded-md font-bold tracking-widest uppercase text-sm shadow-xl hover:bg-amber-300 transition-all"
          >
            Become an Instructor
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
