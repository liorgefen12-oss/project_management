import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { ProjectCompletion } from "../types";

export function useProjectCompletion(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.completion(projectId ?? ""),
    queryFn: () => apiFetch<ProjectCompletion>(`/projects/${projectId}/completed`),
    enabled: !!projectId,
  });
}
