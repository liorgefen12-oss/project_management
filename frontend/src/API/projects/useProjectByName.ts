import { apiFetch } from "../apiFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { Project } from "../types";

export function useProjectByName(name: string) {
  const trimmed = name.trim();
  return useQuery({
    queryKey: queryKeys.projects.byName(trimmed),
    queryFn: () =>
      apiFetch<Project>(
        `/projects/by-name?${new URLSearchParams({ name: trimmed })}`,
      ),
    enabled: trimmed.length > 0,
  });
}
