import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { courseAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STEPS = ['Basic Info', 'Pricing & Settings', 'Review & Submit'];

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    title_bn: '',
    description: '',
    description_bn: '',
    short_description: '',
    category_id: '',
    level: 'all_levels',
    language: 'en',
    price: '',
    discount_price: '',
    is_free: false,
    currency: 'BDT',
    requirements: [''],
    what_you_learn: [''],
    tags: ''
  });

  useEffect(() => {
    api.get('/categories')
      .then((r) => {
        const raw =
          r.data?.data?.categories ||
          r.data?.data ||
          r.data?.categories ||
          [];

        setCategories(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateListItem = (field, idx, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[idx] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addListItem = (field) =>
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));

  const removeListItem = (field, idx) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }));

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail must be under 5MB');
      return;
    }

    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) {
        toast.error('Course title is required');
        return false;
      }
      if (!form.description.trim()) {
        toast.error('Description is required');
        return false;
      }
      if (!form.category_id) {
        toast.error('Please select a category');
        return false;
      }
    }

    if (step === 1) {
      if (!form.is_free && !form.price) {
        toast.error('Please set a price or mark as free');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      const fields = { ...form };

      delete fields.requirements;
      delete fields.what_you_learn;
      delete fields.tags;

      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

      formData.append(
        'requirements',
        JSON.stringify(form.requirements.filter(Boolean))
      );

      formData.append(
        'what_you_learn',
        JSON.stringify(form.what_you_learn.filter(Boolean))
      );

      formData.append(
        'tags',
        JSON.stringify(
          form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const res = await courseAPI.create(formData);
      const courseId = res.data?.data?.course?._id || res.data?.data?.course?.id;

      if (!courseId) {
        toast.error('Course created but course ID not found.');
        return;
      }

      toast.success('Course created! Now add your lessons.');
      navigate(`/instructor/courses/${courseId}/lessons`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(
    (c) => String(c._id || c.id) === String(form.category_id)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details to publish your course on LearnSpace
        </p>
      </div>

      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  i === step ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 ${
                  i < step ? 'bg-green-500' : 'bg-gray-100'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title (English) *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                maxLength={200}
                placeholder="e.g. Complete React.js Masterclass"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title (Bangla)
              </label>
              <input
                type="text"
                value={form.title_bn}
                onChange={(e) => update('title_bn', e.target.value)}
                placeholder="বাংলায় কোর্সের নাম"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={form.short_description}
                onChange={(e) => update('short_description', e.target.value)}
                maxLength={500}
                placeholder="One-line summary of the course"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description (English) *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={5}
                placeholder="Detailed course description..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description (Bangla)
              </label>
              <textarea
                value={form.description_bn}
                onChange={(e) => update('description_bn', e.target.value)}
                rows={3}
                placeholder="বিস্তারিত বর্ণনা..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => update('category_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select category</option>
                  {(Array.isArray(categories) ? categories : []).map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name || c.title || c.category_name || 'Unnamed Category'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={form.level}
                  onChange={(e) => update('level', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all_levels">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="en">English</option>
                <option value="bn">বাংলা (Bangla)</option>
                <option value="both">Both (English + Bangla)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Thumbnail
              </label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => document.getElementById('thumb-input').click()}
              >
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-40 object-cover rounded-lg mx-auto"
                  />
                ) : (
                  <div className="py-6">
                    <p className="text-sm text-gray-400">
                      Click to upload thumbnail (JPG, PNG, max 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="thumb-input"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnail}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What Students Will Learn
              </label>
              {form.what_you_learn.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updateListItem('what_you_learn', i, e.target.value)
                    }
                    placeholder={`Learning outcome ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.what_you_learn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem('what_you_learn', i)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem('what_you_learn')}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                + Add outcome
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites / Requirements
              </label>
              {form.requirements.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updateListItem('requirements', i, e.target.value)
                    }
                    placeholder={`Requirement ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem('requirements', i)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem('requirements')}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                + Add requirement
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => update('tags', e.target.value)}
                placeholder="react, javascript, web development"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <div
                  onClick={() => update('is_free', !form.is_free)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    form.is_free ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                      form.is_free ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Free Course</p>
                  <p className="text-xs text-gray-500">
                    Students can enroll without paying
                  </p>
                </div>
              </label>
            </div>

            {!form.is_free && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="499"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price (optional)
                  </label>
                  <input
                    type="number"
                    value={form.discount_price}
                    onChange={(e) => update('discount_price', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="299"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              Review Your Course
            </h3>

            {[
              { label: 'Title', value: form.title },
              {
                label: 'Category',
                value:
                  selectedCategory?.name ||
                  selectedCategory?.title ||
                  selectedCategory?.category_name ||
                  '-'
              },
              { label: 'Level', value: form.level.replace('_', ' ') },
              {
                label: 'Language',
                value:
                  form.language === 'bn'
                    ? 'বাংলা'
                    : form.language === 'both'
                    ? 'Both'
                    : 'English'
              },
              {
                label: 'Price',
                value: form.is_free
                  ? 'Free'
                  : `৳${form.price}${form.discount_price ? ` (discounted: ৳${form.discount_price})` : ''}`
              }
            ].map((item) => (
              <div key={item.label} className="flex gap-3 text-sm">
                <span className="text-gray-500 w-24 shrink-0">{item.label}:</span>
                <span className="text-gray-800 font-medium">{item.value}</span>
              </div>
            ))}

            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-700 mt-4">
              After creating the course, you will need to add lessons.
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (validateStep()) setStep(step + 1);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;