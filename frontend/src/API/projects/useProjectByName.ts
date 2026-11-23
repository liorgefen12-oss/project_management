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
        `/projects/by-name?name=${encodeURIComponent(trimmed)}`,
      ), //encode the project name to string safe for search
    enabled: trimmed.length > 0,
  });
}
