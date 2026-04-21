// ============================================================
// LearnSpace - Live Classes Section
// Students: see upcoming + past classes, join via meeting_url
// Instructors: schedule new, manage existing
// ============================================================
import React, { useEffect, useState } from 'react';
import { liveClassAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import { toast } from 'react-toastify';

const fmtDateTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getStatus = (cls) => {
  const now = Date.now();
  const start = new Date(cls.scheduled_at).getTime();
  const end = start + (cls.duration_min || 60) * 60000;
  if (cls.status === 'cancelled') return { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' };
  if (now < start)                 return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
  if (now >= start && now <= end)  return { label: 'LIVE NOW', color: 'bg-red-100 text-red-700 animate-pulse' };
  return { label: 'Ended', color: 'bg-gray-100 text-gray-500' };
};

const LiveClassesSection = ({ courseId, isInstructor = false }) => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    meeting_url: '',
    platform: 'meet',
    scheduled_at: '',
    duration_min: 60
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await liveClassAPI.forCourse(courseId);
      setClasses(res.data?.data?.classes || []);
    } catch {
      // silent — user may not have permission
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (courseId) load(); /* eslint-disable-next-line */ }, [courseId]);

  const canManage = isInstructor || user?.role === 'admin';

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.meeting_url.trim() || !form.scheduled_at) {
      toast.error('Title, meeting URL, and date are required.');
      return;
    }
    setSubmitting(true);
    try {
      await liveClassAPI.create({ ...form, course_id: courseId });
      toast.success('Live class scheduled!');
      setShowForm(false);
      setForm({ title: '', description: '', meeting_url: '', platform: 'meet', scheduled_at: '', duration_min: 60 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelClass = async (id) => {
    if (!window.confirm('Cancel this class?')) return;
    try {
      await liveClassAPI.update(id, { status: 'cancelled' });
      toast.success('Class cancelled.');
      load();
    } catch {
      toast.error('Failed to cancel.');
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Delete this class permanently?')) return;
    try {
      await liveClassAPI.remove(id);
      toast.success('Class deleted.');
      load();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Live Classes</h2>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Schedule New'}
          </button>
        )}
      </div>

      {/* Schedule form */}
      {canManage && showForm && (
        <form onSubmit={submit} className="mb-5 p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-100">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Class title (e.g. Week 1 Live Discussion)"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 resize-none"
          />
          <input
            type="url"
            value={form.meeting_url}
            onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
            placeholder="Meeting URL (Zoom / Google Meet / Jitsi link)"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
            >
              <option value="meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="jitsi">Jitsi</option>
              <option value="other">Other</option>
            </select>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              required
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
            />
            <input
              type="number"
              value={form.duration_min}
              onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value, 10) || 60 })}
              min={15}
              max={240}
              placeholder="Duration (min)"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Scheduling...' : 'Schedule Class'}
          </button>
        </form>
      )}

      {/* Classes list */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          {canManage ? 'No live classes scheduled yet.' : 'Your instructor has not scheduled any live classes.'}
        </p>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => {
            const status = getStatus(cls);
            const isJoinable = status.label === 'LIVE NOW' || status.label === 'Upcoming';
            return (
              <div key={cls._id} className="border border-gray-100 rounded-lg p-3 hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900">{cls.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {cls.description && (
                      <p className="text-xs text-gray-500 mt-1">{cls.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>📅 {fmtDateTime(cls.scheduled_at)}</span>
                      <span>⏱ {cls.duration_min} min</span>
                      <span className="capitalize">🎥 {cls.platform}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isJoinable && (
                      <a
                        href={cls.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-700"
                      >
                        Join →
                      </a>
                    )}
                    {canManage && (
                      <>
                        {cls.status !== 'cancelled' && status.label !== 'Ended' && (
                          <button
                            onClick={() => cancelClass(cls._id)}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => deleteClass(cls._id)}
                          className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveClassesSection;
