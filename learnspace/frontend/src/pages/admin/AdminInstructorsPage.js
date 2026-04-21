// ============================================================
// LearnSpace - Admin: Instructor Verification Page
// ============================================================
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Badge, Loader, Modal, EmptyState } from '../../components/common/UI';
import { toast } from 'react-toastify';

const AdminInstructorsPage = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetchInstructors = () => {
    setLoading(true);
    adminAPI.getPendingInstructors()
      .then(res => setInstructors(res.data.data.instructors || []))
      .catch(() => toast.error('Failed to load instructors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInstructors(); }, []);

  const handleAction = async (action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      return toast.error('Please provide a rejection reason.');
    }
    setActionLoading(true);
    try {
      await adminAPI.verifyInstructor(selected._id || selected.id, { action, reason: rejectReason });
      toast.success(`Instructor ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setModalOpen(false);
      setRejectReason('');
      fetchInstructors();
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve instructor applications</p>
      </div>

      {instructors.length === 0 ? (
        <EmptyState
          title="No pending applications"
          description="All instructor applications have been reviewed."
          icon={<span className="text-3xl">✅</span>}
        />
      ) : (
        <div className="grid gap-4">
          {instructors.map(profile => (
            <div key={profile.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {profile.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{profile.user?.name}</h3>
                    <Badge label="Pending Review" color="yellow" />
                    <span className="text-xs text-gray-400">
                      Applied {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{profile.user?.email}</p>
                  {profile.expertise && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Expertise:</span> {profile.expertise}
                    </p>
                  )}
                  {profile.qualifications && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      <span className="font-medium">Qualifications:</span> {profile.qualifications}
                    </p>
                  )}

                  {/* Documents */}
                  <div className="flex gap-3 flex-wrap">
                    {profile.nid_document && (
                      <a href={profile.nid_document} target="_blank" rel="noreferrer"
                        className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        📄 View NID Document
                      </a>
                    )}
                    {profile.certificate_document && (
                      <a href={profile.certificate_document} target="_blank" rel="noreferrer"
                        className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        🎓 View Certificate
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setSelected(profile); setModalOpen('reject'); }}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { setSelected(profile); setModalOpen('approve'); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <Modal isOpen={modalOpen === 'approve'} onClose={() => setModalOpen(false)} title="Approve Instructor">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Approve {selected?.user?.name}?</h3>
          <p className="text-gray-500 text-sm mb-6">
            This will grant them instructor access to create and publish courses on LearnSpace.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={() => handleAction('approve')} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
              {actionLoading ? 'Approving...' : 'Yes, Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={modalOpen === 'reject'} onClose={() => { setModalOpen(false); setRejectReason(''); }} title="Reject Application">
        <div className="py-2">
          <p className="text-gray-600 text-sm mb-4">
            Please provide a reason for rejecting <strong>{selected?.user?.name}</strong>'s application.
          </p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            placeholder="e.g. Incomplete credentials, unclear qualifications..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none mb-4"
          />
          <div className="flex gap-3">
            <button onClick={() => { setModalOpen(false); setRejectReason(''); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={() => handleAction('reject')} disabled={actionLoading || !rejectReason.trim()} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
              {actionLoading ? 'Rejecting...' : 'Reject Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminInstructorsPage;
