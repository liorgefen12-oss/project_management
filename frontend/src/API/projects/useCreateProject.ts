import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { CreateProjectInput, Project } from "../types";

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (project: CreateProjectInput) =>
      apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(project),
      }),
    onSuccess: (project) => {
      qc.setQueryData(queryKeys.projects.detail(project.project_id), project);
      qc.invalidateQueries({ queryKey: queryKeys.projects.list() });
    },
  });
}
