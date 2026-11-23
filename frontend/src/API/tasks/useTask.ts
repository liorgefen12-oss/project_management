import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { Task } from "../types";

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId ?? ""),
    queryFn: () => apiFetch<Task>(`/tasks/${taskId}`),
    enabled: !!taskId, //do only if taskId isnt undefined
  });
}
