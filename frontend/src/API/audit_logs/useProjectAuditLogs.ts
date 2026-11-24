import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { ProjectAuditLog } from "../types";

export function useProjectAuditLogs(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auditLogs.byProjectId(projectId ?? ""),
    queryFn: () =>
      apiFetch<ProjectAuditLog[]>(`/audit-logs/projects/${projectId}`),
    enabled: !!projectId, //execute query only if project exists
  });
}
