import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/common/UI';

const MyCertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/my')
      .then(res => setCertificates(res.data.data.certificates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getViewUrl = (pdfUrl) => {
    if (!pdfUrl) return null;
    const filename = pdfUrl.split('/').pop();
    return `http://localhost:5000/api/certificates/view/${filename}`;
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Certificates</h1>
      <p className="text-gray-500 text-sm mb-6">
        {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
      </p>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">🏆</span>}
          title="No certificates yet"
          description="Complete a course to earn your first certificate!"
          action={
            <Link to="/my-courses" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              View My Courses
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certificates.map(cert => {
            const viewUrl = getViewUrl(cert.pdf_url);
            return (
              <div key={cert.id} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="text-3xl mb-3">🏆</div>
                  <p className="text-xs text-blue-200 uppercase tracking-wide font-medium mb-1">Certificate of Completion</p>
                  <h3 className="font-bold text-lg leading-tight mb-2">{cert.course?.title}</h3>
                  <p className="text-sm text-blue-200 mb-2">
                    Issued: {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {/* Certificate number shown clearly so user can copy it */}
                  <p className="text-xs text-blue-100 bg-white/10 rounded-lg px-3 py-1.5 font-mono mb-4 break-all">
                    {cert.certificate_number}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {viewUrl && (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                      >
                        📄 View Certificate
                      </a>
                    )}
                    {/* Verify link uses certificate number directly */}
                    <Link
                      to={`/verify-certificate/${cert.certificate_number}`}
                      className="bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
                    >
                      🔗 Verify
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>💡 How to share your certificate:</strong> Click <strong>View Certificate</strong> to open the PDF, 
        then share your Certificate Number with anyone. They can verify it at{' '}
        <Link to="/verify-certificate/check" className="underline font-medium">learnspace.com/verify</Link>
      </div>
    </div>
  );
};

export default MyCertificatesPage;