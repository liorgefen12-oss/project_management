import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { Task } from "../types";

export function useTasksByName(name: string) {
  const trimmed = name.trim();
  return useQuery({
    queryKey: queryKeys.tasks.byName(trimmed),
    queryFn: () =>
      apiFetch<Task[]>(`/tasks/by-name?${new URLSearchParams({ name: trimmed })}`),
    enabled: trimmed.length > 0,
  });
}
