import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { BoardTask } from "../types";

// executed: undefined = all tasks, true/false = filter by status
export function useProjectTasks(
  projectId: string | undefined,
  executed?: boolean,
) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId ?? "", executed),
    queryFn: () => {
      let executedFilter = "";
      if (executed)
        //if execution filter is used and not empty, filter the tasks
        executedFilter = `?executed=${executed}`;
      return apiFetch<BoardTask[]>(
        `/projects/${projectId}/tasks${executedFilter}`,
      );
    },
    enabled: !!projectId,
  });
}
