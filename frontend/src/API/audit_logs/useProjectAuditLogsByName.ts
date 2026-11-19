import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query_keys/queryKeys";
import type { AuditLog } from "../types";

export function useProjectAuditLogsByName(name: string) {
  const trimmed = name.trim();
  return useQuery({
    queryKey: queryKeys.auditLogs.byProjectName(trimmed),
    queryFn: () =>
      apiFetch<AuditLog[]>(
        `/audit-logs/projects/by-name?${new URLSearchParams({ name: trimmed })}`,
      ),
    enabled: trimmed.length > 0,
  });
}
