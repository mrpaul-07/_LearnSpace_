// ============================================================
// LearnSpace - EditCoursePage (Full Implementation)
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { courseAPI, resolveEntityId } from '../../services/api';
import { toast } from 'react-toastify';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all_levels', label: 'All Levels' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bangla' },
  { value: 'both', label: 'English & Bangla' }
];

const TagInput = ({
  label, values = [], onChange, placeholder
}) => {
  const [input, setInput] = useState('');

  const add = () => {
    const value = input.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setInput('');
  };

  const remove = (idx) => onChange(values.filter((_, index) => index !== idx));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full">
            {value}
            <button type="button" onClick={() => remove(idx)} className="text-blue-400 hover:text-blue-700 ml-1">×</button>
          </span>
        ))}
      </div>
    </div>
  );
};

const EditCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [form, setForm] = useState({
    title: '',
    title_bn: '',
    description: '',
    description_bn: '',
    short_description: '',
    category_id: '',
    price: '',
    discount_price: '',
    currency: 'BDT',
    level: 'all_levels',
    language: 'en',
    is_free: false,
    requirements: [],
    what_you_learn: [],
    tags: []
  });

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        toast.error('Course ID is missing.');
        navigate('/instructor/dashboard');
        return;
      }

      try {
        const [courseRes, categoryRes] = await Promise.all([
          courseAPI.getOne(courseId),
          api.get('/categories').catch(() => ({ data: { data: { categories: [] } } }))
        ]);

        const course = courseRes.data?.data?.course || courseRes.data?.data || {};
        setCategories(categoryRes.data?.data?.categories || []);

        setForm({
          title: course.title || '',
          title_bn: course.title_bn || '',
          description: course.description || '',
          description_bn: course.description_bn || '',
          short_description: course.short_description || '',
          category_id: resolveEntityId(course.category_id) || '',
          price: course.price ?? '',
          discount_price: course.discount_price ?? '',
          currency: course.currency || 'BDT',
          level: course.level || 'all_levels',
          language: course.language || 'en',
          is_free: Boolean(course.is_free),
          requirements: Array.isArray(course.requirements) ? course.requirements : [],
          what_you_learn: Array.isArray(course.what_you_learn) ? course.what_you_learn : [],
          tags: Array.isArray(course.tags) ? course.tags : []
        });

        if (course.thumbnail) {
          setThumbnailPreview(course.thumbnail);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load course.');
        navigate('/instructor/dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, navigate]);

  const handleChange = (e) => {
    const {
      name, value, type, checked
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleThumbnail = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setThumbnailFile(selectedFile);
    setThumbnailPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseId) {
      toast.error('Course ID is missing.');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Description is required.');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      await courseAPI.update(courseId, formData);
      toast.success('Course updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update course.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!courseId) {
      toast.error('Course ID is missing.');
      return;
    }

    if (!window.confirm('Submit this course for admin review? Make sure all lessons are published.')) {
      return;
    }

    try {
      await courseAPI.submitForReview(courseId);
      toast.success('Course submitted for review!');
      navigate('/instructor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submit failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: '📝 Basic Info' },
    { id: 'details', label: '📋 Details' },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'media', label: '🖼️ Thumbnail' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/instructor/dashboard" className="text-sm text-blue-600 hover:underline mb-1 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-gray-500 text-sm mt-1">{form.title}</p>
        </div>

        <div className="flex gap-3">
          <Link
            to={`/instructor/courses/${courseId}/lessons`}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            📚 Manage Lessons
          </Link>

          <button
            type="button"
            onClick={handleSubmitForReview}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            🚀 Submit for Review
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Complete Web Development Bootcamp"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title in Bangla <span className="text-gray-400">(optional)</span>
              </label>
              <input
                name="title_bn"
                value={form.title_bn}
                onChange={handleChange}
                placeholder="বাংলায় শিরোনাম"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                rows={2}
                placeholder="A brief one-liner shown on course cards (max 150 chars)"
                maxLength={150}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.short_description.length}/150</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe what students will learn, who it's for, and what makes this course great."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description in Bangla <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                name="description_bn"
                value={form.description_bn}
                onChange={handleChange}
                rows={4}
                placeholder="বাংলায় বিস্তারিত বিবরণ"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={resolveEntityId(category) || category.name} value={resolveEntityId(category)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>{language.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <TagInput
              label="What Students Will Learn"
              values={form.what_you_learn}
              onChange={(value) => setForm((prev) => ({ ...prev, what_you_learn: value }))}
              placeholder="e.g. Build real-world projects (press Enter or Add)"
            />

            <TagInput
              label="Requirements / Prerequisites"
              values={form.requirements}
              onChange={(value) => setForm((prev) => ({ ...prev, requirements: value }))}
              placeholder="e.g. Basic knowledge of HTML (press Enter or Add)"
            />

            <TagInput
              label="Tags"
              values={form.tags}
              onChange={(value) => setForm((prev) => ({ ...prev, tags: value }))}
              placeholder="e.g. React, JavaScript (press Enter or Add)"
            />
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <input
                type="checkbox"
                id="is_free"
                name="is_free"
                checked={form.is_free}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="is_free" className="text-sm font-medium text-green-800 cursor-pointer">
                🎓 This is a free course (students can enroll without paying)
              </label>
            </div>

            {!form.is_free && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    name="discount_price"
                    value={form.discount_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {!form.is_free && form.price && form.discount_price && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  💡 Students will pay <strong>৳{parseFloat(form.discount_price).toLocaleString()}</strong> instead of{' '}
                  <span className="line-through text-gray-500">৳{parseFloat(form.price).toLocaleString()}</span> —
                  saving <strong>৳{(parseFloat(form.price) - parseFloat(form.discount_price)).toLocaleString()}</strong>
                  {' '}
                  ({Math.round((1 - parseFloat(form.discount_price) / parseFloat(form.price)) * 100)}% off)
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Course Thumbnail</h3>

            {thumbnailPreview && (
              <div className="mb-4">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full max-w-sm rounded-xl object-cover aspect-video border border-gray-100"
                />
                <p className="text-xs text-gray-400 mt-2">Current thumbnail</p>
              </div>
            )}

            <label className="block w-full max-w-sm cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="text-4xl mb-3">{thumbnailPreview ? '🔄' : '📷'}</div>
                <p className="text-sm font-medium text-gray-700">
                  {thumbnailPreview ? 'Click to replace thumbnail' : 'Click to upload thumbnail'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Recommended: 1280×720px</p>
              </div>
              <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/instructor/dashboard"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCoursePage;
