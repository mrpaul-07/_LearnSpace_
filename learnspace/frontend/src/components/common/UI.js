// ============================================================
// LearnSpace - Reusable UI Components
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';

// Helper: MongoDB _id ba regular id
const getId = (obj) => obj?._id || obj?.id || '';

// ── CourseCard ─────────────────────────────────────────────
export const CourseCard = ({ course }) => {
  const discountedPrice = course.discount_price && course.discount_price < course.price;
  const courseId = getId(course);
  // Backend e populate kora hoy instructor_id ebong category_id hishebe
  const instructor = course.instructor_id || course.instructor || null;
  const category = course.category_id || course.category || null;

  const CardWrapper = courseId
    ? ({ children, ...props }) => <Link to={`/courses/${courseId}`} {...props}>{children}</Link>
    : ({ children, ...props }) => <div {...props}>{children}</div>;

  return (
    <CardWrapper className="group block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        {course.is_free && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">FREE</span>
        )}
        {discountedPrice && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            -{Math.round((1 - course.discount_price / course.price) * 100)}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {category?.name && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {category.name}
            </span>
          )}
          <span className="text-xs text-gray-400 capitalize">{course.level?.replace('_', ' ')}</span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {instructor?.name && (
          <p className="text-xs text-gray-500 mb-2">by {instructor.name}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(course.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {parseFloat(course.avg_rating || 0).toFixed(1)} ({course.total_reviews || 0})
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {discountedPrice ? (
              <>
                <span className="font-bold text-gray-900">৳{course.discount_price}</span>
                <span className="text-xs text-gray-400 line-through">৳{course.price}</span>
              </>
            ) : (
              <span className="font-bold text-gray-900">
                {course.is_free ? 'Free' : `৳${course.price}`}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{course.total_enrollments || 0} students</span>
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
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
      />
    </div>
  );
};

// ── ProgressBar ────────────────────────────────────────────
export const ProgressBar = ({ percent, showLabel = true, color = 'blue' }) => {
  const colorMap = { blue: 'bg-blue-600', green: 'bg-green-500', yellow: 'bg-yellow-500' };
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && <span className="text-xs text-gray-500">{Math.round(percent || 0)}% complete</span>}
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || colorMap.blue}`}
          style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%` }}
        />
      </div>
    </div>
  );
};

// ── StatCard ───────────────────────────────────────────────
export const StatCard = ({ title, value, icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ── Badge ──────────────────────────────────────────────────
export const Badge = ({ label, color = 'blue' }) => {
  const map = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[color] || map.gray}`}>
      {label}
    </span>
  );
};

// ── Loader ─────────────────────────────────────────────────
export const Loader = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${s[size]} border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon || <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
    {action}
  </div>
);

// ── Modal ──────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Previous
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
          >
            {page}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
};
