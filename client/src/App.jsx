import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import AvailablePolls from './pages/AvailablePolls';
import VotePoll from './pages/VotePoll';
import PollResults from './pages/PollResults';
import MyPolls from './pages/MyPolls';
import PollHistory from './pages/PollHistory';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Layout wrapper for authenticated pages
const AuthLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <Navbar />
      {children}
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
