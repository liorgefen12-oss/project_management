import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { ProjectCompletion } from "../types";

export function useProjectCompletion(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.completion(projectId ?? ""), //where to store the data
    queryFn: () =>
      apiFetch<ProjectCompletion>(`/projects/${projectId}/completed`), //the route leads to the completion check
    //(the function checking if all project's tasks are executed)
    enabled: !!projectId,
  });
}
