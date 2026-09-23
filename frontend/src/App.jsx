import "./App.css";
import { useEffect } from "react";
import { getCurrentUser } from "./features/auth/services/authService";
import useAuthStore from "./store/authStore";
import AppRouter from "./routes/AppRouter";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    async function restoreUser() {
      const user = await getCurrentUser();
      setUser(user);
    }
    restoreUser();
  }, [isAuthenticated, setUser]);

  return <AppRouter />;
}

export default App;
