// ============================================================
// LearnSpace - Home Page
// ============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseCard, Loader } from '../components/common/UI';
import api, { courseAPI } from '../services/api';

// Helper: MongoDB _id ba regular id
const getId = (obj) => obj?._id || obj?.id || '';

// Fallback categories (jodi backend kichu return na kore)
const FALLBACK_CATEGORIES = [
  { name: 'Web Development', icon: '💻' },
  { name: 'Data Science', icon: '📊' },
  { name: 'UI/UX Design', icon: '🎨' },
  { name: 'Mobile Apps', icon: '📱' },
  { name: 'Digital Marketing', icon: '📣' },
  { name: 'Business', icon: '💼' },
];

// Backend theke icon name ashle (e.g. "briefcase", "code"), emoji te convert koro
const iconNameToEmoji = {
  // Lucide icon names → emoji
  'briefcase': '💼',
  'code': '💻',
  'code-2': '💻',
  'laptop': '💻',
  'database': '📊',
  'bar-chart': '📊',
  'chart': '📊',
  'palette': '🎨',
  'brush': '🎨',
  'pen-tool': '🎨',
  'smartphone': '📱',
  'phone': '📱',
  'mobile': '📱',
  'megaphone': '📣',
  'speaker': '📣',
  'microphone': '🎤',
  'camera': '📷',
  'music': '🎵',
  'book': '📚',
  'graduation-cap': '🎓',
  'globe': '🌐',
  'heart': '❤️',
  'star': '⭐',
  // Category name fallback (jodi backend emoji ba icon name kichui na pathai)
  'web development': '💻',
  'data science': '📊',
  'ui/ux design': '🎨',
  'design': '🎨',
  'mobile apps': '📱',
  'mobile app development': '📱',
  'digital marketing': '📣',
  'marketing': '📣',
  'business': '💼',
  'programming': '👨‍💻',
  'photography': '📷',
  'language': '🗣',
};

const resolveIcon = (category) => {
  // Jodi backend already emoji pathai (😀 type), just return
  const icon = category?.icon;
  if (icon && /\p{Emoji}/u.test(icon)) return icon;

  // Nahole icon name theke emoji khujho
  if (icon && iconNameToEmoji[icon.toLowerCase()]) {
    return iconNameToEmoji[icon.toLowerCase()];
  }

  // Nahole category name theke khujho
  const name = category?.name?.toLowerCase();
  if (name && iconNameToEmoji[name]) return iconNameToEmoji[name];

  // Default
  return '📚';
};

const STATS = [
  { value: '10,000+', label: 'Students' },
  { value: '500+', label: 'Courses' },
  { value: '200+', label: 'Instructors' },
  { value: '50+', label: 'Categories' }
];

const HomePage = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    courseAPI.getFeatured()
      .then(res => setFeaturedCourses(res.data.data.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/categories')
      .then(res => {
        const cats = res.data?.data?.categories || [];
        setCategories(cats);
      })
      .catch(() => setCategories([]));
  }, []);

  const displayCategories = categories.length > 0
    ? categories.slice(0, 6).map(c => ({
        id: getId(c),
        name: c.name,
        icon: resolveIcon(c),
      }))
    : FALLBACK_CATEGORIES.map(c => ({ ...c, id: null }));

  return (
    <div>
      {/* ── Hero Section ────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Learn New Skills,<br />
              <span className="text-yellow-300">Build Your Future</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-xl">
              Join thousands of students learning from verified instructors. 
              Access courses in Bangla & English from anywhere.
            </p>

            {/* Search Bar */}
            <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-xl max-w-xl">
              <div className="flex items-center flex-1 px-3">
                <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn?"
                  className="flex-1 text-gray-800 outline-none text-sm"
                  onKeyDown={e => e.key === 'Enter' && window.location.assign(`/courses?search=${encodeURIComponent(searchQuery)}`)}
                />
              </div>
              <Link
                to={`/courses?search=${encodeURIComponent(searchQuery)}`}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
              >
                Search
              </Link>
            </div>

            <p className="text-blue-200 text-sm mt-4">
              Popular: Web Development, Data Science, UI/UX Design
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-gray-500 text-sm mt-1">Explore courses across popular topics</p>
            </div>
            <Link to="/courses" className="text-sm text-blue-600 font-medium hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayCategories.map((cat, idx) => (
              <Link
                key={cat.id || idx}
                to={cat.id ? `/courses?category=${cat.id}` : '/courses'}
                className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-center group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ─────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked courses by our team</p>
            </div>
            <Link to="/courses" className="text-sm text-blue-600 font-medium hover:underline">
              View All Courses →
            </Link>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.slice(0, 8).map(course => (
                <CourseCard key={getId(course)} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Become Instructor CTA ─────────────────────────── */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Share Your Knowledge & Earn</h2>
          <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
            Join 200+ verified instructors on LearnSpace. Create courses, teach students across Bangladesh, and earn revenue.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register?role=instructor" className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
              Become an Instructor
            </Link>
            <Link to="/courses" className="border border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">LS</span>
                </div>
                <span className="text-white font-bold">LearnSpace</span>
              </div>
              <p className="text-sm text-gray-500">Bangladesh's premier e-learning marketplace in Bangla & English.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/courses" className="hover:text-white transition-colors">Browse Courses</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link to="/register?role=instructor" className="hover:text-white transition-colors">Teach on LearnSpace</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><Link to="/verify-certificate/check" className="hover:text-white transition-colors">Verify Certificate</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} LearnSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;