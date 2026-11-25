import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { BoardTask } from "../types";

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId ?? ""),
    queryFn: () => apiFetch<BoardTask[]>(`/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
}
