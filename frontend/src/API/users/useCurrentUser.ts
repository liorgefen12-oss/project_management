import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { User } from "../types";
import { useGlobalStore } from "../../store/useGlobalStore";

// 401 means "not logged in", so don't retry it
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me, //saved in query map under users/me
    queryFn: async () => {
      const user = await apiFetch<User>("/users/me");
      useGlobalStore.getState().setUser(user);
      return user;
    },
    retry: false,
  });
}
