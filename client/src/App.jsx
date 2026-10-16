import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Eagerly loaded public authentication pages
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded routes for optimal bundle code-splitting and performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatePoll = lazy(() => import('./pages/CreatePoll'));
const AvailablePolls = lazy(() => import('./pages/AvailablePolls'));
const VotePoll = lazy(() => import('./pages/VotePoll'));
const PollResults = lazy(() => import('./pages/PollResults'));
const MyPolls = lazy(() => import('./pages/MyPolls'));
const PollHistory = lazy(() => import('./pages/PollHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Layout wrapper for authenticated pages with mobile responsive drawer
const AuthLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setMobileOpen((prev) => !prev)} />
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Suspense fallback={<LoadingSpinner size="lg" text="Poll voting is loading..." fullScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuthLayout><AdminDashboard /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthLayout><Dashboard /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls"
              element={
                <ProtectedRoute>
                  <AuthLayout><AvailablePolls /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-poll"
              element={
                <ProtectedRoute allowedRoles={['creator', 'admin']}>
                  <AuthLayout><CreatePoll /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/:id/vote"
              element={
                <ProtectedRoute>
                  <AuthLayout><VotePoll /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/:id/results"
              element={
                <ProtectedRoute>
                  <AuthLayout><PollResults /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-polls"
              element={
                <ProtectedRoute allowedRoles={['creator', 'admin']}>
                  <AuthLayout><MyPolls /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AuthLayout><PollHistory /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AuthLayout><Profile /></AuthLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AuthLayout><Settings /></AuthLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
