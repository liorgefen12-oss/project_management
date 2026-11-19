import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/users/logout", { method: "POST" }),
    onSuccess: () => {
      client.setQueryData(queryKeys.users.me, null);
      // Drop every other cached resource of the previous user
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.users.me[0],
      });
    },
  });
}
