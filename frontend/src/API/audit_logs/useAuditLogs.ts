import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { AuditLog, AuditLogType } from "../types";

export function useAuditLogs(type?: AuditLogType) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(type),
    queryFn: () => apiFetch<AuditLog[]>(`/audit-logs${type ? `?type=${type}` : ""}`),
  });
}
