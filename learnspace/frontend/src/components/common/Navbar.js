// ============================================================
// LearnSpace - Navbar Component (with i18n + language toggle)
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../context/authStore';

const Navbar = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => {
    const next = i18n.language?.startsWith('bn') ? 'en' : 'bn';
    i18n.changeLanguage(next);
  };
  const isBn = i18n.language?.startsWith('bn');

  const getDashboardLink = () => {
    if (!user) return '/';
    const map = { admin: '/admin/dashboard', instructor: '/instructor/dashboard', student: '/dashboard' };
    return map[user.role] || '/';
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LearnSpace</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/courses"
              className={`text-sm font-medium transition-colors ${isActive('/courses') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              {t('nav.browse')}
            </Link>
            {token && (
              <Link
                to={getDashboardLink()}
                className={`text-sm font-medium transition-colors ${isActive('/dashboard') || isActive('/instructor') || isActive('/admin') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                {t('nav.dashboard')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
              className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isBn ? 'EN' : 'বাং'}
            </button>

            {!token ? (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {t('nav.signup')}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 leading-none">{user?.name?.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                      📊 {t('nav.dashboard')}
                    </Link>
                    {user?.role === 'student' && (
                      <>
                        <Link to="/my-courses" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                          📚 {t('nav.my_courses')}
                        </Link>
                        <Link to="/certificates" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                          🏆 {t('nav.certificates')}
                        </Link>
                      </>
                    )}
                    {user?.role === 'instructor' && (
                      <Link to="/instructor/courses/create" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                        ➕ {t('nav.create_course')}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      🚪 {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          <Link to="/courses" className="block py-2 text-sm text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>{t('nav.browse')}</Link>
          {token ? (
            <>
              <Link to={getDashboardLink()} className="block py-2 text-sm text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-red-600">{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-sm text-gray-700 hover:text-blue-600" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className="block py-2 text-sm text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>{t('nav.signup')}</Link>
            </>
          )}
          <button onClick={toggleLang} className="block w-full text-left py-2 text-sm text-gray-700">
            {isBn ? '🌐 English' : '🌐 বাংলা'}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
