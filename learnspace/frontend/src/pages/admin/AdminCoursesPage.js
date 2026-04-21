import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader, Badge, Modal, EmptyState } from '../../components/common/UI';
import { toast } from 'react-toastify';

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [actionModal, setActionModal] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    api.get('/admin/courses/pending')
      .then(res => setCourses(res.data.data.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAction = async (action) => {
    try {
      await api.patch(`/admin/courses/${selected._id || selected.id}/review`, { action, reason });
      toast.success(`Course ${action}d!`);
      setActionModal(null); setReason('');
      fetchCourses();
    } catch { toast.error('Action failed.'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Moderation</h1>
      <p className="text-gray-500 text-sm mb-6">{courses.length} course{courses.length !== 1 ? 's' : ''} pending review</p>
      {loading ? <Loader /> : courses.length === 0 ? (
        <EmptyState title="All clear!" description="No courses pending review." icon={<span className="text-3xl">✅</span>} />
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course._id || course.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex gap-4 items-start">
                <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-100 flex items-center justify-center">📚</div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-xs text-gray-400">
                    by {(course.instructor_id || course.instructor)?.name || 'Unknown'}
                    {(course.category_id || course.category)?.name && ` · ${(course.category_id || course.category).name}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>💰 {course.is_free ? 'Free' : `৳${course.price}`}</span>
                    <span className="capitalize">{course.level?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setSelected(course); setActionModal('reject'); }} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50">Reject</button>
                  <button onClick={() => { setSelected(course); setActionModal('approve'); }} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700">Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={!!actionModal} onClose={() => { setActionModal(null); setReason(''); }} title={actionModal === 'approve' ? 'Approve Course' : 'Reject Course'}>
        <div className="py-2">
          <p className="text-sm text-gray-600 mb-4">{actionModal === 'approve' ? `Approve "${selected?.title}"?` : 'Please provide a reason for rejection.'}</p>
          {actionModal === 'reject' && (
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for rejection..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4" />
          )}
          <div className="flex gap-3">
            <button onClick={() => { setActionModal(null); setReason(''); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={() => handleAction(actionModal)} disabled={actionModal === 'reject' && !reason.trim()} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 ${actionModal === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {actionModal === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCoursesPage;
