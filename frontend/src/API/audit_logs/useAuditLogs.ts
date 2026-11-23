import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { AuditLog, AuditLogType } from "../types";

export function useAuditLogs(type?: AuditLogType) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(type),
    queryFn: () => {
      const path = type ? "/audit-logs" + "?type=" + type : "/audit-logs";
      return apiFetch<AuditLog[]>(path);
    },
  });
}
