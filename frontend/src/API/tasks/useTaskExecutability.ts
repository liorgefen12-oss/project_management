import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

export function useTaskExecutability(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.executable(taskId ?? ""),
    queryFn: () => apiFetch<boolean>(`/tasks/${taskId}/executable`),
    enabled: !!taskId,
  });
}
