// ============================================================
// LearnSpace - Reusable UI Components (Vintage Deep Green Theme)
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';

const getId = (obj) => obj?._id || obj?.id || '';

// ── CourseCard ─────────────────────────────────────────────
export const CourseCard = ({ course }) => {
  const discountedPrice = course.discount_price && course.discount_price < course.price;
  const courseId = getId(course);
  const instructor = course.instructor_id || course.instructor || null;
  const category = course.category_id || course.category || null;

  const CardWrapper = courseId
    ? ({ children, ...props }) => <Link to={`/courses/${courseId}`} {...props}>{children}</Link>
    : ({ children, ...props }) => <div {...props}>{children}</div>;

  return (
    <CardWrapper className="group block card-vintage rounded-lg hover:shadow-vintage-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-cream-200 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200">
            <svg className="w-14 h-14 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {course.is_free && (
          <span className="absolute top-2 left-2 bg-amber-400 text-forest-900 text-xs font-bold px-2 py-1 rounded shadow-md tracking-wider">FREE</span>
        )}
        {discountedPrice && (
          <span className="absolute top-2 right-2 bg-forest-700 text-cream-50 text-xs font-bold px-2 py-1 rounded shadow-md">
            -{Math.round((1 - course.discount_price / course.price) * 100)}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {category?.name && (
            <span className="text-xs font-ui font-medium text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">
              {category.name}
            </span>
          )}
          <span className="text-xs text-forest-500 capitalize font-ui italic">{course.level?.replace('_', ' ')}</span>
        </div>

        <h3 className="font-display font-bold text-forest-800 text-base leading-snug mb-1 line-clamp-2 group-hover:text-forest-900 transition-colors">
          {course.title}
        </h3>

        {instructor?.name && (
          <p className="text-sm text-forest-600 mb-2 italic font-sans">by {instructor.name}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(course.avg_rating || 0) ? 'text-amber-400' : 'text-cream-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-forest-500 font-ui">
            {parseFloat(course.avg_rating || 0).toFixed(1)} ({course.total_reviews || 0})
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-cream-200">
          <div className="flex items-center gap-1.5">
            {discountedPrice ? (
              <>
                <span className="font-display font-bold text-forest-800 text-lg">৳{course.discount_price}</span>
                <span className="text-xs text-forest-400 line-through">৳{course.price}</span>
              </>
            ) : (
              <span className="font-display font-bold text-forest-800 text-lg">
                {course.is_free ? 'Free' : `৳${course.price}`}
              </span>
            )}
          </div>
          <span className="text-xs text-forest-500 font-ui italic">{course.total_enrollments || 0} students</span>
        </div>
      </div>
    </CardWrapper>
  );
};

// ── SearchBar ──────────────────────────────────────────────
export const SearchBar = ({ value, onChange, onSearch, placeholder = 'Search courses...' }) => {
  const handleKey = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(value);
  };

  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-forest-200 rounded-md text-sm font-ui focus:ring-2 focus:ring-forest-400 focus:border-forest-400 outline-none bg-cream-50 text-forest-800 placeholder-forest-400"
      />
    </div>
  );
};

// ── ProgressBar ────────────────────────────────────────────
export const ProgressBar = ({ percent, showLabel = true, color = 'forest' }) => {
  const colorMap = {
    forest: 'bg-forest-600',
    amber:  'bg-amber-400',
    blue:   'bg-forest-600',
    green:  'bg-forest-500',
    yellow: 'bg-amber-300'
  };
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && <span className="text-xs text-forest-600 font-ui">{Math.round(percent || 0)}% complete</span>}
      </div>
      <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden shadow-inner-paper">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || colorMap.forest}`}
          style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%` }}
        />
      </div>
    </div>
  );
};

// ── StatCard ───────────────────────────────────────────────
export const StatCard = ({ title, value, icon, color = 'forest', trend }) => {
  const colorMap = {
    forest: 'bg-forest-100 text-forest-700',
    amber:  'bg-amber-100 text-amber-500',
    blue:   'bg-forest-100 text-forest-700',
    green:  'bg-forest-100 text-forest-600',
    yellow: 'bg-amber-100 text-amber-500',
    purple: 'bg-forest-200 text-forest-800',
    red:    'bg-red-50 text-red-600'
  };

  return (
    <div className="card-vintage rounded-lg p-5 hover:shadow-vintage-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-forest-600 mb-1 font-ui">{title}</p>
          <p className="font-display text-3xl font-bold text-forest-800">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-ui ${trend.positive ? 'text-forest-600' : 'text-red-500'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-md ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ── Badge ──────────────────────────────────────────────────
export const Badge = ({ label, color = 'forest' }) => {
  const map = {
    forest: 'bg-forest-100 text-forest-700 border border-forest-200',
    amber:  'bg-amber-100 text-amber-500 border border-amber-200',
    blue:   'bg-forest-100 text-forest-700 border border-forest-200',
    green:  'bg-forest-100 text-forest-600 border border-forest-200',
    yellow: 'bg-amber-100 text-amber-500 border border-amber-200',
    red:    'bg-red-50 text-red-700 border border-red-200',
    gray:   'bg-cream-200 text-forest-600 border border-cream-300',
    purple: 'bg-forest-200 text-forest-800 border border-forest-300'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-ui font-medium ${map[color] || map.gray}`}>
      {label}
    </span>
  );
};

// ── Loader ─────────────────────────────────────────────────
export const Loader = ({ size = 'md' }) => {
  const s = { sm: 'w-5 h-5', md: 'w-10 h-10', lg: 'w-14 h-14' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${s[size]} border-4 border-cream-200 border-t-forest-600 rounded-full animate-spin`} />
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 bg-cream-100 border-2 border-cream-300 rounded-full flex items-center justify-center mb-4 shadow-inner-paper">
      {icon || <svg className="w-10 h-10 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
    </div>
    <h3 className="font-display text-xl font-bold text-forest-800 mb-2">{title}</h3>
    <p className="text-sm text-forest-600 max-w-sm mb-6 font-sans italic">{description}</p>
    {action}
  </div>
);

// ── Modal ──────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className={`card-vintage rounded-lg shadow-vintage-lg w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto border-2 border-forest-200`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-cream-200">
          <h3 className="font-display text-xl font-bold text-forest-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-cream-100 rounded-md transition-colors">
            <svg className="w-5 h-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ── Pagination ─────────────────────────────────────────────
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-md text-sm font-ui font-medium border border-forest-200 text-forest-700 disabled:opacity-40 hover:bg-forest-50 transition-colors"
      >
        Previous
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-md text-sm font-ui font-semibold transition-colors ${currentPage === page ? 'bg-forest-700 text-cream-50 shadow-md' : 'border border-forest-200 text-forest-700 hover:bg-forest-50'}`}
          >
            {page}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-md text-sm font-ui font-medium border border-forest-200 text-forest-700 disabled:opacity-40 hover:bg-forest-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
};
