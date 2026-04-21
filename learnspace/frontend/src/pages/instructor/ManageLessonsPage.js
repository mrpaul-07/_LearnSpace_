// ============================================================
// LearnSpace - Manage Lessons Page (Instructor)
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { courseAPI, resolveEntityId } from '../../services/api';
import { Loader, Badge, Modal } from '../../components/common/UI';
import LiveClassesSection from '../../components/common/LiveClassesSection';
import { toast } from 'react-toastify';

const LESSON_TYPES = [
  { value: 'video', label: '▶ Video', icon: '▶' },
  { value: 'document', label: '📄 Document', icon: '📄' },
  { value: 'quiz', label: '📝 Quiz', icon: '📝' },
  { value: 'assignment', label: '📌 Assignment', icon: '📌' }
];

const normalizeLesson = (lesson) => ({
  ...lesson,
  id: resolveEntityId(lesson)
});

const normalizeCourse = (course) => ({
  ...course,
  id: resolveEntityId(course)
});

const ManageLessonsPage = () => {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const defaultLesson = {
    title: '',
    title_bn: '',
    description: '',
    type: 'video',
    is_preview: false,
    is_published: false
  };

  const [form, setForm] = useState(defaultLesson);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) {
        toast.error('Course ID is missing from the route.');
        setLoading(false);
        return;
      }

      try {
        const [courseRes, lessonRes] = await Promise.all([
          courseAPI.getOne(courseId),
          api.get(`/lessons/course/${courseId}`)
        ]);

        const loadedCourse = courseRes.data?.data?.course || courseRes.data?.data || null;
        const loadedLessons = lessonRes.data?.data?.lessons || [];

        setCourse(loadedCourse ? normalizeCourse(loadedCourse) : null);
        setLessons(
          loadedLessons
            .map(normalizeLesson)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        );
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || 'Failed to load course data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId]);

  const openCreate = () => {
    setForm(defaultLesson);
    setFile(null);
    setEditLesson(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const openEdit = (lesson) => {
    setForm({ ...defaultLesson, ...lesson });
    setFile(null);
    setEditLesson(lesson);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!courseId) {
      toast.error('Course ID is missing.');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Lesson title is required.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, typeof value === 'boolean' ? String(value) : value);
        }
      });

      if (!editLesson && form.order_index == null) {
        formData.set('order_index', String(lessons.length + 1));
      }

      if (file) {
        formData.append('content', file);
      }

      let response;

      if (editLesson) {
        const lessonId = resolveEntityId(editLesson);
        if (!lessonId) {
          throw new Error('Lesson ID is missing.');
        }

        response = await api.put(`/lessons/${lessonId}`, formData, {
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        });

        const updatedLesson = normalizeLesson(response.data?.data?.lesson || {});
        setLessons((prev) => prev.map((lesson) => (
          resolveEntityId(lesson) === lessonId ? updatedLesson : lesson
        )));
        toast.success('Lesson updated!');
      } else {
        response = await api.post(`/lessons/course/${courseId}`, formData, {
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          }
        });

        const createdLesson = normalizeLesson(response.data?.data?.lesson || {});
        setLessons((prev) => (
          [...prev, createdLesson].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        ));
        toast.success('Lesson added!');
      }

      setModalOpen(false);
      setUploadProgress(0);
      setFile(null);
      setEditLesson(null);
      setForm(defaultLesson);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save lesson.');
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (lesson) => {
    const lessonId = resolveEntityId(lesson);

    if (!lessonId) {
      toast.error('Lesson ID is missing.');
      return;
    }

    try {
      const response = await api.patch(`/lessons/${lessonId}/toggle-publish`);
      const updatedLesson = normalizeLesson(response.data?.data?.lesson || {});
      setLessons((prev) => prev.map((item) => (
        resolveEntityId(item) === lessonId ? updatedLesson : item
      )));
      toast.success(`Lesson ${updatedLesson.is_published ? 'published' : 'unpublished'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lesson.');
    }
  };

  const deleteLesson = async (lesson) => {
    const lessonId = resolveEntityId(lesson);

    if (!lessonId) {
      toast.error('Lesson ID is missing.');
      return;
    }

    if (!window.confirm('Delete this lesson? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/lessons/${lessonId}`);
      setLessons((prev) => prev.filter((item) => resolveEntityId(item) !== lessonId));
      toast.success('Lesson deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lesson.');
    }
  };

  const handleSubmitForReview = async () => {
    const publishedCount = lessons.filter((lesson) => lesson.is_published).length;

    if (publishedCount === 0) {
      toast.error('You need at least one published lesson before submitting.');
      return;
    }

    try {
      await courseAPI.submit(courseId);
      toast.success('Course submitted for admin review! 🚀');
      setCourse((prev) => ({ ...prev, status: 'pending_review' }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed.');
    }
  };

  if (loading) return <Loader />;

  const publishedCount = lessons.filter((lesson) => lesson.is_published).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <Link to="/instructor/dashboard" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Manage Lessons</h1>
          <p className="text-gray-500 text-sm mt-1 line-clamp-1">{course?.title}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {course?.status === 'draft' && publishedCount > 0 && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Submit for Review 🚀
            </button>
          )}

          <button
            type="button"
            onClick={openCreate}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Lesson
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Lessons</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Published</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 capitalize">
            <Badge
              label={course?.status?.replace('_', ' ') || 'draft'}
              color={course?.status === 'published' ? 'green' : course?.status === 'pending_review' ? 'yellow' : 'gray'}
            />
          </p>
          <p className="text-xs text-gray-500 mt-1">Course Status</p>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No lessons yet</h3>
          <p className="text-gray-400 text-sm mb-4">Add your first lesson to get started</p>
          <button
            type="button"
            onClick={openCreate}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add First Lesson
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {lessons.map((lesson, idx) => {
            const lessonId = resolveEntityId(lesson);

            return (
              <div
                key={lessonId || `lesson-${idx}`}
                className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group"
              >
                <div className="text-gray-300 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">⠿</div>

                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  {lesson.type === 'video' ? '▶' : lesson.type === 'document' ? '📄' : lesson.type === 'quiz' ? '📝' : '📌'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">
                      {idx + 1}. {lesson.title}
                    </span>
                    {lesson.is_preview && <Badge label="Preview" color="blue" />}
                    {lesson.is_published ? <Badge label="Published" color="green" /> : <Badge label="Draft" color="gray" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {lesson.type}
                    {lesson.duration ? ` · ${Math.floor(lesson.duration / 60)}m` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(lesson)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePublish(lesson)}
                    className={`p-1.5 rounded-lg transition-colors ${lesson.is_published ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                    title={lesson.is_published ? 'Unpublish' : 'Publish'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={lesson.is_published
                          ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                          : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'}
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteLesson(lesson)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Classes management */}
      <div className="mt-6">
        <LiveClassesSection courseId={courseId} isInstructor={true} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editLesson ? 'Edit Lesson' : 'Add New Lesson'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title (English) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to React Hooks"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title (Bangla)</label>
              <input
                type="text"
                value={form.title_bn || ''}
                onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                placeholder="বাংলায় পাঠের নাম"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Type</label>
            <div className="grid grid-cols-4 gap-2">
              {LESSON_TYPES.map((typeOption) => (
                <button
                  type="button"
                  key={typeOption.value}
                  onClick={() => setForm({ ...form, type: typeOption.value })}
                  className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    form.type === typeOption.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {typeOption.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Brief lesson description..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {(form.type === 'video' || form.type === 'document') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.type === 'video' ? 'Video File (MP4, max 500MB)' : 'Document (PDF, DOC)'}
              </label>

              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => document.getElementById('lesson-file').click()}
              >
                {file ? (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Click to upload {form.type === 'video' ? 'video' : 'document'}
                  </p>
                )}

                <input
                  id="lesson-file"
                  type="file"
                  accept={form.type === 'video' ? 'video/*' : '.pdf,.doc,.docx'}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.is_preview)}
                onChange={(e) => setForm({ ...form, is_preview: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Free Preview (visible without enrollment)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={uploading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? `Uploading ${uploadProgress}%...` : editLesson ? 'Save Changes' : 'Add Lesson'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageLessonsPage;
