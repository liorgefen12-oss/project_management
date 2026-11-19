import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { MoveTaskResponse } from "../types";

export function useMoveTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, position }: { taskId: string; position: number }) =>
      apiFetch<MoveTaskResponse>(`/tasks/${taskId}/position`, {
        method: "PATCH",
        body: JSON.stringify({ position }),
      }),
    onSuccess: ({ tasks }) => {
      // The response is the full, re-ordered board
      client.setQueryData(queryKeys.projects.tasks(projectId), tasks);
      client.invalidateQueries({
        queryKey: queryKeys.projects.allTasks(projectId),
      });
      client.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
