import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { Project } from "../types";

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ""),
    queryFn: () => apiFetch<Project>(`/projects/${projectId}`),
    enabled: !!projectId, //run query only if projectId is true, not undefined or null
  });
}
