import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { TaskPredecessor } from "../types";

// All (direct and indirect) predecessors, nearest first
export function useTaskPredecessors(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.predecessors(taskId ?? ""),
    queryFn: () => apiFetch<TaskPredecessor[]>(`/tasks/${taskId}/predecessors`),
    enabled: !!taskId,
  });
}
