// ============================================================
// LearnSpace - Certificate Verify Page (Public)
// Anyone can visit this page and enter a Certificate Number
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const CertificateVerifyPage = () => {
  const { certNumber } = useParams(); // pre-filled from Verify button
  const [input, setInput]   = useState(certNumber || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Auto-verify if cert number came from URL
  useEffect(() => {
    if (certNumber) handleVerify(null, certNumber);
  }, [certNumber]);

  const handleVerify = async (e, overrideValue) => {
    if (e) e.preventDefault();
    const value = (overrideValue || input).trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/certificates/verify/${value}`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Certificate</h1>
        <p className="text-gray-500 text-sm mt-2">
          Enter a LearnSpace Certificate Number to verify its authenticity.
          <br />The Certificate Number is printed at the bottom of every certificate.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Certificate Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. LS-1775621125899-CAUXOZ"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Verify'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-5 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <span className="font-bold text-green-800 text-lg">Valid Certificate</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Student Name:</span>
                <span className="text-gray-800 font-semibold">{result.student_name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Course:</span>
                <span className="text-gray-800 font-medium">{result.course_title}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Certificate No:</span>
                <span className="text-gray-600 font-mono text-xs">{result.certificate_number}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Issued On:</span>
                <span className="text-gray-800">
                  {new Date(result.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        This verification service is provided by LearnSpace. 
        Results are based on our official records.
      </p>
    </div>
  );
};

export default CertificateVerifyPage;