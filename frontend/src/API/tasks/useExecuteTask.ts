import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { ExecutedTaskProject } from "../types";

export function useExecuteTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<ExecutedTaskProject>(`/tasks/${taskId}/execute`, {
        method: "POST",
      }),
    onSettled: () => {
      // update all related cache
      client.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      client.invalidateQueries({ queryKey: queryKeys.projects.list() });
      client.invalidateQueries({ queryKey: queryKeys.tasks.all });
      client.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
    },
  });
}
