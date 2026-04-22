// ============================================================
// LearnSpace - Navbar (Vintage Deep Green Theme)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../context/authStore';
import { messageAPI } from '../../services/api';

const Navbar = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!token) { setUnreadMessages(0); return; }
    let cancelled = false;
    const fetchCount = () => {
      messageAPI.unreadCount()
        .then(res => { if (!cancelled) setUnreadMessages(res.data?.data?.count || 0); })
        .catch(() => {});
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [token]);

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

  const navLinkClass = (active) =>
    `text-sm font-medium transition-colors tracking-wide ${
      active ? 'text-amber-400' : 'text-cream-100 hover:text-amber-300'
    }`;

  return (
    <nav className="bg-forest-gradient border-b-2 border-amber-400/30 sticky top-0 z-50 shadow-vintage-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="LearnSpace"
              className="h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <p className="font-display text-xl font-bold text-cream-50 leading-none tracking-wider">
                LearnSpace
              </p>
              <p className="text-xs text-amber-300 font-ui italic tracking-widest uppercase mt-0.5">
                E-Learning
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/courses" className={navLinkClass(isActive('/courses'))}>
              {t('nav.browse')}
            </Link>
            {token && (
              <Link
                to={getDashboardLink()}
                className={navLinkClass(isActive('/dashboard') || isActive('/instructor') || isActive('/admin'))}
              >
                {t('nav.dashboard')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">

            {token && (
              <Link
                to="/messages"
                className="relative text-cream-100 hover:text-amber-300 transition-colors p-2"
                title="Messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-forest-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-forest-800">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={toggleLang}
              title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
              className="px-3 py-1.5 text-xs font-medium border border-amber-400/40 text-cream-100 rounded-md hover:bg-amber-400/10 hover:border-amber-400 transition-colors"
            >
              {isBn ? 'EN' : 'বাং'}
            </button>

            {!token ? (
              <>
                <Link to="/login" className="text-sm font-medium text-cream-100 hover:text-amber-300 px-3 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-400 text-forest-900 px-5 py-2 rounded-md text-sm font-bold hover:bg-amber-300 transition-all shadow-lg hover:shadow-xl tracking-wide"
                >
                  {t('nav.signup')}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-forest-800/50 rounded-md px-3 py-1.5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center overflow-hidden border-2 border-amber-300 shadow-md">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-forest-900 text-sm font-bold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-cream-50 leading-none">{user?.name?.split(' ')[0]}</p>
                    <p className="text-xs text-amber-300 capitalize italic">{user?.role}</p>
                  </div>
                  <svg className="w-4 h-4 text-cream-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 card-vintage rounded-md py-2 z-50 border border-forest-200">
                    <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sm text-forest-800 hover:bg-cream-100" onClick={() => setDropdownOpen(false)}>
                      📊 <span>{t('nav.dashboard')}</span>
                    </Link>
                    {user?.role === 'student' && (
                      <>
                        <Link to="/my-courses" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-800 hover:bg-cream-100" onClick={() => setDropdownOpen(false)}>
                          📚 <span>{t('nav.my_courses')}</span>
                        </Link>
                        <Link to="/certificates" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-800 hover:bg-cream-100" onClick={() => setDropdownOpen(false)}>
                          🏆 <span>{t('nav.certificates')}</span>
                        </Link>
                      </>
                    )}
                    {user?.role === 'instructor' && (
                      <Link to="/instructor/courses/create" className="flex items-center gap-2 px-4 py-2 text-sm text-forest-800 hover:bg-cream-100" onClick={() => setDropdownOpen(false)}>
                        ➕ <span>{t('nav.create_course')}</span>
                      </Link>
                    )}
                    <hr className="my-1 border-cream-200" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                      🚪 <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-cream-100 hover:bg-forest-800/50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-forest-800 border-t border-amber-400/20 px-4 py-3 space-y-2">
          <Link to="/courses" className="block py-2 text-sm text-cream-100 hover:text-amber-300" onClick={() => setMenuOpen(false)}>{t('nav.browse')}</Link>
          {token ? (
            <>
              <Link to={getDashboardLink()} className="block py-2 text-sm text-cream-100 hover:text-amber-300" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>
              <Link to="/messages" className="block py-2 text-sm text-cream-100 hover:text-amber-300" onClick={() => setMenuOpen(false)}>
                Messages {unreadMessages > 0 && <span className="ml-1 bg-amber-400 text-forest-900 text-xs px-1.5 rounded-full font-bold">{unreadMessages}</span>}
              </Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-amber-300">{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-sm text-cream-100 hover:text-amber-300" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className="block py-2 text-sm text-amber-300 font-bold" onClick={() => setMenuOpen(false)}>{t('nav.signup')}</Link>
            </>
          )}
          <button onClick={toggleLang} className="block w-full text-left py-2 text-sm text-cream-100">
            {isBn ? '🌐 English' : '🌐 বাংলা'}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
