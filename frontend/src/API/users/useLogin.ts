import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { LoginInput, User } from "../types";

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
    },
  });
}
