import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { EditProjectInput, EditProjectResponse } from "../types";

export function useEditProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      changes,
    }: {
      projectId: string;
      changes: EditProjectInput;
    }) =>
      apiFetch<EditProjectResponse>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),
    onSuccess: ({ project }) => {
      qc.setQueryData(queryKeys.projects.detail(project.project_id), project);
      // The name shows up in the project dropdown and by-name lookups
      qc.invalidateQueries({ queryKey: queryKeys.projects.list() });
      qc.invalidateQueries({ queryKey: queryKeys.projects.byNamePrefix });
      // A budget change is written to the audit log
      qc.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
    },
  });
}
