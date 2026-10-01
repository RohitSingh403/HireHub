import "./App.css";
import { useEffect } from "react";
import { getCurrentUser } from "./features/auth/services/authService";
import useAuthStore from "./store/authStore";
import AppRouter from "./routes/AppRouter";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    async function restoreUser() {
      try {
        const user = await getCurrentUser();
        if (!cancelled) {
          setUser(user);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (!cancelled && (status === 401 || status === 404)) {
          logout();
        }
      }
    }
    restoreUser();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setUser, logout]);

  return <AppRouter />;
}

export default App;
