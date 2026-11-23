import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { LoginInput, User } from "../types";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginInput) =>
      apiFetch<User>("/users/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (user) => {
      client.setQueryData(queryKeys.users.me, user);
      useGlobalStore.getState().setUser(user);
    },
  });
}
