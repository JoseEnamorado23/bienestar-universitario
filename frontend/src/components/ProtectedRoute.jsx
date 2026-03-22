import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, requiredPermissions = [] }) {
  const { isAuthenticated, loading, permissions } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasAll = requiredPermissions.every((p) => permissions.includes(p));
    if (!hasAll) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
