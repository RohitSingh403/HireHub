import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthAttempt =
      url.includes("/api/auth/login") || url.includes("/api/auth/register");

    if (status === 401 && !isAuthAttempt && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export default api;
