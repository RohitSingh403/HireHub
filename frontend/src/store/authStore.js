import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function authStorage() {
  const storage = createJSONStorage(() => localStorage);
  return {
    getItem(name) {
      try {
        return storage.getItem(name);
      } catch {
        try {
          localStorage.removeItem(name);
        } catch {
          // Ignore a storage that cannot be cleared.
        }
        return null;
      }
    },
    setItem(name, value) {
      return storage.setItem(name, value);
    },
    removeItem(name) {
      return storage.removeItem(name);
    },
  };
}

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
      storage: authStorage(),
    },
  ),
);

export function useAuthHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribe = useAuthStore.persist.onFinishHydration(onStoreChange);
      if (useAuthStore.persist.hasHydrated()) {
        queueMicrotask(onStoreChange);
      }
      return unsubscribe;
    },
    () => useAuthStore.persist.hasHydrated(),
    () => true,
  );
}

export default useAuthStore;
