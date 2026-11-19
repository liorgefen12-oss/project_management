import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { Project } from "../types";

export function useProjectByTask(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.byTask(taskId ?? ""),
    queryFn: () => apiFetch<Project>(`/projects/by-task/${taskId}`),
    enabled: !!taskId,
  });
}
