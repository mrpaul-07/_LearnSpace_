// ============================================================
// LearnSpace - Course Marketplace Page
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseAPI } from '../services/api';
import api from '../services/api';
import { CourseCard, SearchBar, Loader, EmptyState, Pagination } from '../components/common/UI';

// Helper: _id ba id — jeta pawa jay
const getId = (obj) => obj?._id || obj?.id || '';

const LEVELS = ['all_levels', 'beginner', 'intermediate', 'advanced'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' }
];

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories once
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data?.categories || [])).catch(() => {});
  }, []);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      limit: 12,
      sort: sortBy,
      ...(search && { search }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedLevel && { level: selectedLevel }),
      ...(selectedLanguage && { language: selectedLanguage }),
      ...(isFree && { is_free: true })
    };
    courseAPI.getAll(params)
      .then(res => {
        setCourses(res.data.data.courses);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, selectedCategory, selectedLevel, selectedLanguage, isFree, sortBy]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(''); setSelectedCategory(''); setSelectedLevel('');
    setSelectedLanguage(''); setIsFree(false); setSortBy('newest'); setPage(1);
  };

  const activeFiltersCount = [selectedCategory, selectedLevel, selectedLanguage, isFree ? 'free' : ''].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Marketplace</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.total > 0 ? `${pagination.total.toLocaleString()} courses available` : 'Explore all courses'}
        </p>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-64">
          <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} placeholder="Search courses, topics, instructors..." />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters {activeFiltersCount > 0 && <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{activeFiltersCount}</span>}
        </button>

        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Category</label>
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={getId(c)} value={getId(c)}>{c.name}</option>)}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Level</label>
              <select
                value={selectedLevel}
                onChange={e => { setSelectedLevel(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Language</label>
              <select
                value={selectedLanguage}
                onChange={e => { setSelectedLanguage(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Free toggle + Reset */}
            <div className="flex flex-col justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => { setIsFree(!isFree); setPage(1); }}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isFree ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${isFree ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Free courses only</span>
              </label>
              {activeFiltersCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 text-left mt-2">
                  ✕ Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory && categories.find(c => String(getId(c)) === String(selectedCategory)) && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {categories.find(c => String(getId(c)) === String(selectedCategory))?.name}
              <button onClick={() => setSelectedCategory('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          {selectedLevel && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {selectedLevel.replace('_', ' ')}
              <button onClick={() => setSelectedLevel('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          {selectedLanguage && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {selectedLanguage === 'bn' ? 'বাংলা' : selectedLanguage === 'en' ? 'English' : 'Both'}
              <button onClick={() => setSelectedLanguage('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          {isFree && (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              Free only
              <button onClick={() => setIsFree(false)} className="ml-1 hover:text-green-900">×</button>
            </span>
          )}
        </div>
      )}

      {/* Course Grid */}
      {loading ? (
        <Loader />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={<button onClick={resetFilters} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">Clear Filters</button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map(course => <CourseCard key={getId(course)} course={course} />)}
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
