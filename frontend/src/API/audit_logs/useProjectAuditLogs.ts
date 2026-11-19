import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { AuditLog } from "../types";

export function useProjectAuditLogs(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auditLogs.byProjectId(projectId ?? ""),
    queryFn: () => apiFetch<AuditLog[]>(`/audit-logs/projects/${projectId}`),
    enabled: !!projectId,
  });
}
