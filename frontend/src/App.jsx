import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

// Layouts
import { LandingLayout } from './layouts/LandingLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { RaiseComplaintPage } from './pages/RaiseComplaintPage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';
import { ComplaintManagementPage } from './pages/ComplaintManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { StaffPerformancePage } from './pages/StaffPerformancePage';
import { StudentManagementPage } from './pages/StudentManagementPage';


// Route Guard: Authentication Check
const ProtectedRoute = ({ children }) => {
  const { user, loadingData } = useAuth();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route Guard: Redirect Logged-in Users from Public Pages
const PublicRoute = ({ children }) => {
  const { user, loadingData } = useAuth();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route Guard: Role Check (Student-only)
const StudentRoute = ({ children }) => {
  const { role, loadingData } = useAuth();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (role?.toUpperCase() !== 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route Guard: Role Check (Admin-only)
const AdminRoute = ({ children }) => {
  const { role, loadingData } = useAuth();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (role?.toUpperCase() !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Dynamic Dashboard Selector
const DashboardSelector = () => {
  const { role } = useAuth();
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return <AdminDashboard />;
  }
  if (normalizedRole === 'STAFF') {
    return <StaffDashboard />;
  }
  return <StudentDashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website Routes */}
          <Route
            path="/"
            element={
              <LandingLayout>
                <LandingPage />
              </LandingLayout>
            }
          />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Secure App Dashboard Portal */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardSelector />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/raise-complaint"
            element={
              <ProtectedRoute>
                <StudentRoute>
                  <DashboardLayout>
                    <RaiseComplaintPage />
                  </DashboardLayout>
                </StudentRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <StudentRoute>
                  <DashboardLayout>
                    <MyComplaintsPage />
                  </DashboardLayout>
                </StudentRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ComplaintDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/complaints/:id"
            element={
              <ProtectedRoute>
                <StudentRoute>
                  <DashboardLayout>
                    <ComplaintDetailsPage />
                  </DashboardLayout>
                </StudentRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-complaints"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <ComplaintManagementPage />
                  </DashboardLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff-management"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <StaffManagementPage />
                  </DashboardLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-management"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <StudentManagementPage />
                  </DashboardLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff-performance"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <StaffPerformancePage />
                  </DashboardLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
