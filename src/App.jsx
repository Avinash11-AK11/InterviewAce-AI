import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/dashboard/Dashboard';
import AptitudeHome from './pages/aptitude/AptitudeHome';
import TestSession from './pages/aptitude/TestSession';
import TestResult from './pages/aptitude/TestResult';
import TechnicalHome from './pages/technical/TechnicalHome';
import CodingHome from './pages/coding/CodingHome';
import ProblemDetail from './pages/coding/ProblemDetail';
import ResumeUpload from './pages/resume/ResumeUpload';
import ResumeAnalysis from './pages/resume/ResumeAnalysis';
import InterviewSetup from './pages/interview/InterviewSetup';
import InterviewSession from './pages/interview/InterviewSession';
import InterviewResult from './pages/interview/InterviewResult';
import AnswerEvaluator from './pages/evaluator/AnswerEvaluator';
import RoadmapGenerator from './pages/roadmap/RoadmapGenerator';
import RoadmapView from './pages/roadmap/RoadmapView';
import Analytics from './pages/analytics/Analytics';
import Leaderboard from './pages/gamification/Leaderboard';
import Badges from './pages/gamification/Badges';
import Notifications from './pages/notifications/Notifications';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageQuestions from './pages/admin/ManageQuestions';
import ManageCoding from './pages/admin/ManageCoding';
import Reports from './pages/admin/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FAF6F1',
                color: '#3D3530',
                borderRadius: '14px',
                boxShadow: '8px 8px 16px #D4CFC8, -8px -8px 16px #FFFFFF',
                border: '1px solid rgba(255,255,255,0.8)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#8FAF8F', secondary: '#FAF6F1' },
              },
              error: {
                iconTheme: { primary: '#F0B8C8', secondary: '#FAF6F1' },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<UserLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/aptitude" element={<AptitudeHome />} />
                <Route path="/aptitude/test" element={<TestSession />} />
                <Route path="/aptitude/result/:id" element={<TestResult />} />
                <Route path="/technical" element={<TechnicalHome />} />
                <Route path="/coding" element={<CodingHome />} />
                <Route path="/coding/problem/:id" element={<ProblemDetail />} />
                <Route path="/resume" element={<ResumeUpload />} />
                <Route path="/resume/analysis/:id" element={<ResumeAnalysis />} />
                <Route path="/mock-interview" element={<InterviewSetup />} />
                <Route path="/mock-interview/session" element={<InterviewSession />} />
                <Route path="/mock-interview/result" element={<InterviewResult />} />
                <Route path="/evaluator" element={<AnswerEvaluator />} />
                <Route path="/roadmap" element={<RoadmapGenerator />} />
                <Route path="/roadmap/view" element={<RoadmapView />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/achievements" element={<Badges />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/questions" element={<ManageQuestions />} />
                <Route path="/admin/coding" element={<ManageCoding />} />
                <Route path="/admin/reports" element={<Reports />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
