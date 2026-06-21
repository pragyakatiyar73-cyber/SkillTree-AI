import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import AuthCallbackPage from './components/auth/AuthCallbackPage';
import OnboardingPage from './components/onboarding/OnboardingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import RoadmapPage from './components/roadmap/RoadmapPage';
import ProjectsPage from './components/projects/ProjectsPage';
import ProjectDetailPage from './components/projects/ProjectDetailPage';
import ResumePage from './components/resume/ResumePage';
import MentorPage from './components/mentor/MentorPage';
import ProgressPage from './components/progress/ProgressPage';
import LeetCodePage from './components/leetcode/LeetCodePage';
import MockInterviewPage from './components/mock-interview/MockInterviewPage';
import PlacementPage from './components/placement/PlacementPage';
import SettingsPage from './components/settings/SettingsPage';
import FeedbackPage from './components/settings/FeedbackPage';
import AnalyticsPage from './components/shared/AnalyticsPage';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (user) {
    if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout currentPage="dashboard"><DashboardHome /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/roadmap" element={<ProtectedRoute><DashboardLayout currentPage="roadmap"><RoadmapPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/projects" element={<ProtectedRoute><DashboardLayout currentPage="projects"><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/projects/:id" element={<ProtectedRoute><DashboardLayout currentPage="projects"><ProjectDetailPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/resume" element={<ProtectedRoute><DashboardLayout currentPage="resume"><ResumePage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/mentor" element={<ProtectedRoute><DashboardLayout currentPage="mentor"><MentorPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/progress" element={<ProtectedRoute><DashboardLayout currentPage="progress"><ProgressPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/leetcode" element={<ProtectedRoute><DashboardLayout currentPage="leetcode"><LeetCodePage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/mock-interview" element={<ProtectedRoute><DashboardLayout currentPage="mock-interview"><MockInterviewPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/placement" element={<ProtectedRoute><DashboardLayout currentPage="placement"><PlacementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout currentPage="settings"><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/feedback" element={<ProtectedRoute><DashboardLayout currentPage="feedback"><FeedbackPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardLayout currentPage="analytics"><AnalyticsPage /></DashboardLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
