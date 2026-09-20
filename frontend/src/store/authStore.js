import { create } from "zustand";

const useAuthStore = create(() => ({
  token: null,
  user: null,
  isAuthenticated: false,
}));

export default useAuthStore;
