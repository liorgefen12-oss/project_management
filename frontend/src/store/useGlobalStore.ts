import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "../API/types";

interface GlobalState {
  user: User | null;
  projectId: string | null;
  // Owner of the remembered projectId, so another user never inherits it
  projectUserId: string | null;
  setUser: (user: User) => void;
  setProjectId: (projectId: string | null) => void;
  clearUser: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      user: null,
      projectId: null,
      projectUserId: null,
      setUser: (user) =>
        set((state) =>
          state.projectUserId === user.user_id
            ? { user }
            : { user, projectId: null, projectUserId: null },
        ),
      setProjectId: (projectId) =>
        set({
          projectId,
          projectUserId: projectId ? (get().user?.user_id ?? null) : null,
        }),
      // Logging out (or a 401) also leaves the current project
      clearUser: () => set({ user: null, projectId: null, projectUserId: null }),
    }),
    {
      name: "project-board",
      storage: createJSONStorage(() => sessionStorage),
      // The user always comes from GET /users/me; only the open project survives a refresh
      partialize: (state) => ({
        projectId: state.projectId,
        projectUserId: state.projectUserId,
      }),
    },
  ),
);
