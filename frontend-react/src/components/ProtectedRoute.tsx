import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(auth.hasToken());
  }, []);

  // Show nothing while checking (prevents flash)
  if (isAuthenticated === null) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
