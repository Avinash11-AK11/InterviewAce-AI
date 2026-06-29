const fs = require('fs');
const path = require('path');

const filesToCreate = [
  'components/auth/AdminRoute.jsx',
  'pages/auth/Register.jsx',
  'pages/auth/ForgotPassword.jsx',
  'pages/dashboard/Dashboard.jsx',
  'pages/aptitude/AptitudeHome.jsx',
  'pages/aptitude/TestSession.jsx',
  'pages/aptitude/TestResult.jsx',
  'pages/technical/TechnicalHome.jsx',
  'pages/coding/CodingHome.jsx',
  'pages/coding/ProblemDetail.jsx',
  'pages/resume/ResumeUpload.jsx',
  'pages/resume/ResumeAnalysis.jsx',
  'pages/interview/InterviewSession.jsx',
  'pages/interview/InterviewResult.jsx',
  'pages/evaluator/AnswerEvaluator.jsx',
  'pages/roadmap/RoadmapGenerator.jsx',
  'pages/roadmap/RoadmapView.jsx',
  'pages/analytics/Analytics.jsx',
  'pages/gamification/Leaderboard.jsx',
  'pages/gamification/Badges.jsx',
  'pages/notifications/Notifications.jsx',
  'pages/profile/Profile.jsx',
  'pages/admin/AdminDashboard.jsx',
  'pages/admin/ManageUsers.jsx',
  'pages/admin/ManageQuestions.jsx',
  'pages/admin/ManageCoding.jsx',
  'pages/admin/Reports.jsx'
];

filesToCreate.forEach(file => {
  const fullPath = path.join(__dirname, 'src', file);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fullPath)) {
    let componentName = path.basename(file, '.jsx');
    
    // Special case for AdminRoute
    if (componentName === 'AdminRoute') {
      fs.writeFileSync(fullPath, `import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminRoute() {
  const { userProfile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (userProfile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
`);
    } else {
      fs.writeFileSync(fullPath, `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    <div className="p-8 text-center">\n      <h1 className="text-2xl font-bold">${componentName}</h1>\n      <p>This page is under construction.</p>\n    </div>\n  );\n}\n`);
    }
    console.log('Created:', file);
  } else {
    console.log('Exists:', file);
  }
});
