import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { isAuthRequired } from "@/lib/auth-config";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (!isAuthRequired) {
    return <Outlet />;
  }

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Restoring your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
