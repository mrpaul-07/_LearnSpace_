// ============================================================
// LearnSpace - App.js (React Router v6)
// ============================================================
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from './context/authStore';
import api from './services/api';

// Pages - Public
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import CourseDetailPage from './pages/CourseDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';

// Pages - Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyCoursesPage from './pages/student/MyCoursesPage';
import LearnPage from './pages/student/LearnPage';
import QuizPage from './pages/student/QuizPage';
import MyCertificatesPage from './pages/student/MyCertificatesPage';
import PaymentPage from './pages/student/PaymentPage';
import PaymentSuccessPage from './pages/student/PaymentSuccessPage';
import PaymentFailedPage from './pages/student/PaymentFailedPage';

// Pages - Instructor
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CreateCoursePage from './pages/instructor/CreateCoursePage';
import EditCoursePage from './pages/instructor/EditCoursePage';
import ManageLessonsPage from './pages/instructor/ManageLessonsPage';
import EarningsPage from './pages/instructor/EarningsPage';
import InstructorAnalyticsPage from './pages/instructor/InstructorAnalyticsPage';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminInstructorsPage from './pages/admin/AdminInstructorsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ChatBot from './components/common/ChatBot';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

function App() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<MarketplacePage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-certificate/:certNumber" element={<CertificateVerifyPage />} />

            {/* Student Routes */}
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <StudentDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/my-courses"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <MyCoursesPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/learn/:courseId"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <LearnPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/learn/:courseId/quiz/:quizId"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <QuizPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/certificates"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <MyCertificatesPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/payment/:courseId"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['student']}>
                    <PaymentPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/payment/success"
              element={(
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              )}
            />
            <Route path="/payment/failed" element={<PaymentFailedPage /> } />

            {/* Instructor Routes */}
            <Route
              path="/instructor/dashboard"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <InstructorDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/instructor/courses/create"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <CreateCoursePage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/instructor/courses/:courseId/edit"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <EditCoursePage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/instructor/courses/:courseId/lessons"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <ManageLessonsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/instructor/earnings"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <EarningsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/instructor/analytics"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['instructor']}>
                    <InstructorAnalyticsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/users"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminUsersPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/courses"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminCoursesPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/instructors"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminInstructorsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/payments"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminPaymentsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/reports"
              element={(
                <ProtectedRoute>
                  <RoleRoute roles={['admin']}>
                    <AdminReportsPage />
                  </RoleRoute>
                </ProtectedRoute>
              )}
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <ChatBot />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      </div>
    </BrowserRouter>
  );
}

export default App;
