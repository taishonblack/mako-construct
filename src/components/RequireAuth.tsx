import { useOptionalAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: string;
}

/**
 * Wraps a page that requires authentication.
 * Redirects to /login if the user isn't signed in.
 */
export function RequireAuth({ children, fallback = "/login" }: RequireAuthProps) {
  const auth = useOptionalAuth();
  const location = useLocation();

  if (auth?.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth?.user) {
    return <Navigate to={fallback} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
