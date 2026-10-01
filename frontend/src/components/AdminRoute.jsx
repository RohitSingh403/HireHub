import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../features/auth/services/authService.js";
import useAuthStore, { useAuthHydrated } from "../store/authStore.js";
import Forbidden from "./Forbidden.jsx";

function AdminRoute() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const [session, setSession] = useState({ token: "", status: "checking" });

  const signedOut = hydrated && (!isAuthenticated || !token);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !token) {
      return undefined;
    }

    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (cancelled) {
          return;
        }
        if (user?.role !== "admin") {
          setSession({ token, status: "forbidden" });
          return;
        }
        setUser(user);
        setSession({ token, status: "ready" });
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err?.response?.status === 401) {
          logout();
          return;
        }
        setSession({
          token,
          status: err?.response?.status === 403 ? "forbidden" : "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, token, logout, setUser]);

  if (!hydrated || (!signedOut && session.token !== token)) {
    return (
      <p className="grid min-h-screen place-items-center text-muted">Loading HireHub…</p>
    );
  }

  if (signedOut) {
    return <Navigate to="/admin/login" replace />;
  }

  if (session.status === "forbidden") {
    return <Forbidden />;
  }

  if (session.status === "error") {
    return (
      <p className="grid min-h-screen place-items-center px-6 text-center text-muted">
        HireHub could not confirm this session. Try signing in again.
      </p>
    );
  }

  return <Outlet />;
}

export default AdminRoute;
