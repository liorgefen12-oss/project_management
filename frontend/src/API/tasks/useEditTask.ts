import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
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
      client.invalidateQueries({ queryKey: queryKeys.tasks.all }); //update all tasks
      client.invalidateQueries({
        queryKey: queryKeys.projects.tasks(task.project), //update all tasks of project
      });
    },
  });
}
