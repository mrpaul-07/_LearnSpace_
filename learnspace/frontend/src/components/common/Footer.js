// ============================================================
// LearnSpace - Footer (Vintage Theme)
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest-gradient text-cream-100 mt-16 border-t-2 border-amber-400/30 relative">
      <div className="absolute inset-0 bg-paper opacity-20 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="LearnSpace" className="h-14 w-auto drop-shadow-md" />
              <div>
                <p className="font-display text-2xl font-bold text-cream-50 tracking-wider">
                  LearnSpace
                </p>
                <p className="text-xs text-amber-300 italic tracking-widest uppercase">
                  E-Learning Platform
                </p>
              </div>
            </div>
            <p className="text-cream-200 font-sans italic leading-relaxed max-w-md">
              An open-source learning marketplace. Verified instructors, real certificates,
              Bangla + English support. Study at your own pace, from anywhere.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display text-lg font-bold text-amber-300 mb-4 tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 font-sans">
              <li><Link to="/courses" className="text-cream-200 hover:text-amber-300 transition-colors">Browse Courses</Link></li>
              <li><Link to="/register" className="text-cream-200 hover:text-amber-300 transition-colors">Become an Instructor</Link></li>
              <li><Link to="/login" className="text-cream-200 hover:text-amber-300 transition-colors">Log In</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-lg font-bold text-amber-300 mb-4 tracking-wider">
              About
            </h4>
            <ul className="space-y-2 font-sans">
              <li><span className="text-cream-200">Built with MERN stack</span></li>
              <li><span className="text-cream-200">CSE412 Academic Project</span></li>
              <li><span className="text-cream-200">East West University</span></li>
            </ul>
          </div>
        </div>

        <div className="vintage-divider mt-10 mb-5">
          <span className="text-amber-300/70 text-xs tracking-widest uppercase">Scientia Est Potentia</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-cream-300 font-sans">
          <p>&copy; {year} LearnSpace. All rights reserved.</p>
          <p className="italic mt-2 md:mt-0">Crafted with care for learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
