import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    set({
      token: token,
      user: user,
      isAuthenticated: true,
    });
  },
}));

export default useAuthStore;
