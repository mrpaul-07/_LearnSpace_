import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage = () => (
  <div className="max-w-md mx-auto px-4 py-16 text-center">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
      <p className="text-gray-500 text-sm mb-6">You are now enrolled. Start learning!</p>
      <Link to="/my-courses" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
        Go to My Courses →
      </Link>
    </div>
  </div>
);

export default PaymentSuccessPage;
