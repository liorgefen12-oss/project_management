import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { AuditLog } from "../types";

export function useProjectAuditLogsByName(name: string) {
  const trimmed = name.trim();
  return useQuery({
    queryKey: queryKeys.auditLogs.byProjectName(trimmed),
    queryFn: () =>
      apiFetch<AuditLog[]>(
        `/audit-logs/projects/by-name?name=${encodeURIComponent(trimmed)}`,
      ), //encode the project name to string safe for search
    enabled: trimmed.length > 0,
  });
}
