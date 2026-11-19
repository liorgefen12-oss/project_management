import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { EditTaskInput, EditTaskResponse } from "../types";

export function useEditTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      changes,
    }: {
      taskId: string;
      changes: EditTaskInput;
    }) =>
      apiFetch<EditTaskResponse>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),
    onSuccess: ({ task }) => {
      client.setQueryData(queryKeys.tasks.detail(task.task_id), task);
      // Predecessor changes can affect executability of other tasks too
      client.invalidateQueries({ queryKey: queryKeys.tasks.all });
      client.invalidateQueries({
        queryKey: queryKeys.projects.allTasks(task.project),
      });
    },
  });
}
