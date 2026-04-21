// ============================================================
// LearnSpace - Course Reviews Component
// List all reviews for a course. Enrolled students can post/edit.
// ============================================================
import React, { useEffect, useState } from 'react';
import { reviewAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import { toast } from 'react-toastify';

const Star = ({ filled, onClick, interactive = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!interactive}
    className={`text-xl leading-none ${filled ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
  >
    ★
  </button>
);

const StarRow = ({ value, onChange, interactive = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} filled={n <= value} onClick={interactive ? () => onChange(n) : undefined} interactive={interactive} />
    ))}
  </div>
);

const CourseReviews = ({ courseId, isEnrolled }) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    const calls = [reviewAPI.list(courseId)];
    if (user?.role === 'student' && isEnrolled) {
      calls.push(reviewAPI.mine(courseId));
    }
    Promise.all(calls)
      .then(results => {
        setReviews(results[0]?.data?.data?.reviews || []);
        if (results[1]) {
          const mine = results[1]?.data?.data?.review;
          setMyReview(mine);
          if (mine) {
            setRating(mine.rating);
            setComment(mine.comment || '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (courseId) load(); /* eslint-disable-next-line */ }, [courseId, isEnrolled]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewAPI.save(courseId, { rating, comment });
      toast.success(myReview ? 'Review updated!' : 'Review posted!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMine = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewAPI.remove(courseId);
      setMyReview(null);
      setRating(5);
      setComment('');
      toast.success('Review deleted.');
      load();
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const canReview = user?.role === 'student' && isEnrolled;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Student Reviews</h2>
        <span className="text-xs text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Post/edit form */}
      {canReview && (
        <form onSubmit={submit} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-gray-800 mb-2">
            {myReview ? 'Update your review' : 'Leave a review'}
          </p>
          <StarRow value={rating} onChange={setRating} interactive />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)..."
            rows={3}
            maxLength={1000}
            className="w-full mt-2 p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : myReview ? 'Update Review' : 'Post Review'}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={deleteMine}
                className="text-red-600 px-4 py-1.5 text-sm rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}

      {!canReview && user?.role === 'student' && (
        <p className="text-xs text-gray-400 mb-4">Enroll in this course to post a review.</p>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => {
            const reviewer = r.student_id || {};
            return (
              <div key={r._id || r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {reviewer.avatar ? (
                      <img src={reviewer.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {reviewer.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reviewer.name || 'Student'}</p>
                        <StarRow value={r.rating} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {r.comment && <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.comment}</p>}
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

export default CourseReviews;
