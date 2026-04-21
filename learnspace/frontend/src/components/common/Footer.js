// ============================================================
// LearnSpace - Footer Component
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">LS</span>
          </div>
          <span className="text-white font-semibold text-sm">LearnSpace</span>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <Link to="/courses" className="hover:text-white transition-colors">Browse Courses</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          <Link to="/verify-certificate/check" className="hover:text-white transition-colors">Verify Certificate</Link>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} LearnSpace. Made with ❤️ in Bangladesh.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
