import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import AccessDenied from './AccessDenied';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner size="lg" text="Poll voting is loading..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isActive === false) {
    return (
      <AccessDenied
        title="Account Deactivated"
        message="Your account has been deactivated by an administrator. Please contact support to restore access."
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <AccessDenied
        title="Access Restricted"
        message="You do not have the required permissions or role to view this section."
        requiredRole={allowedRoles.join(' or ')}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
