import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/users/logout", { method: "POST" }),
    onSuccess: () => {
      useGlobalStore.getState().clearUser();
      client.setQueryData(queryKeys.users.me, null);
      // Drop every other cached resource of the previous user
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.users.me[0],
        //if true (it is true because the data was reset)
        //remove data (user info) from cache
      });
    },
  });
}
