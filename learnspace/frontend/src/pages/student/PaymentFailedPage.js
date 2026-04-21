// ============================================================
// LearnSpace - Payment Failed Page
// ============================================================
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentFailedPage = () => {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'Your payment could not be processed.';

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8">
        <div className="text-5xl mb-3">😔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 text-sm mb-6">{reason}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/courses" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            Back to Courses
          </Link>
          <Link to="/dashboard" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
