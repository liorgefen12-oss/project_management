import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { BoardTask } from "../types";

// executed: undefined = all tasks, true/false = filter by status
export function useProjectTasks(projectId: string | undefined, executed?: boolean) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId ?? "", executed),
    queryFn: () => {
      const query = executed === undefined ? "" : `?executed=${executed}`;
      return apiFetch<BoardTask[]>(`/projects/${projectId}/tasks${query}`);
    },
    enabled: !!projectId,
  });
}
