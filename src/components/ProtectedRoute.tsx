import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("ADMIN" | "MANAGER" | "VENDOR" | "CUSTOMER")[];
  redirectTo?: string;
}

const fallbackRoles: Array<"ADMIN" | "MANAGER" | "VENDOR" | "CUSTOMER"> = [
  "ADMIN",
  "MANAGER",
  "VENDOR",
  "CUSTOMER",
];

const ProtectedRoute = ({
  children,
  allowedRoles = fallbackRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { user, isLoading } = useSupabaseAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6f0]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#4e342e]" />
          <p className="text-sm text-[#4e342e] font-medium">Checking your access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // 🚨 Not logged in
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 🚨 Logged in but role not allowed
    const getRedirectPath = (role: string) => {
      switch (role) {
        case 'ADMIN': return '/admin';
        case 'MANAGER': return '/manager';
        case 'VENDOR': return '/vendor';
        default: return '/';
      }
    };
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
