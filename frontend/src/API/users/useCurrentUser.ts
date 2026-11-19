import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { User } from "../types";

// 401 means "not logged in", so don't retry it
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => apiFetch<User>("/users/me"),
    retry: false,
  });
}
