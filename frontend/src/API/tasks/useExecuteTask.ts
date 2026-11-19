import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { ExecutedTaskProject } from "../types";

export function useExecuteTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<ExecutedTaskProject>(`/tasks/${taskId}/execute`, {
        method: "POST",
      }),
    // Invalidate on error too: a rejected attempt is still written to the audit log
    onSettled: () => {
      // Budget, value, board, and completion of this project
      client.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      client.invalidateQueries({ queryKey: queryKeys.projects.list() });
      // Executing a task can unlock its successors
      client.invalidateQueries({ queryKey: queryKeys.tasks.all });
      client.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
    },
  });
}
