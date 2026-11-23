import { apiFetch } from "../apiFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { CreateTaskInput, Task } from "../types";

export function useCreateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (task: CreateTaskInput) =>
      apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(task) }),
    onSuccess: (task) => {
      client.setQueryData(queryKeys.tasks.detail(task.task_id), task);
      // Board order and project completion both change
      client.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.project),
      });
    },
  });
}
