import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
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
      
      setUser: (user) => {
        set({
          user: user,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "hirehub-auth",
    },
  ),
);

export default useAuthStore;
