import { Navigate, Outlet } from "react-router-dom";
import useAuthStore, { useAuthHydrated } from "../store/authStore";
import { homePath } from "../utils/homePath";

function ProtectedRoute({ role }) {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!hydrated) {
    return (
      <p className="grid min-h-screen place-items-center text-muted">Loading HireHub…</p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={homePath(user?.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
