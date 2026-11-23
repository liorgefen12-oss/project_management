import type { AuditLogType } from "./types";

// Keys are hierarchical so invalidating a prefix (e.g. projects.detail(id))
// also refreshes everything nested under it (its tasks, completion, ...).
const projectDetail = (projectId: string) => ["projects", projectId] as const;
const projectAllTasks = (projectId: string) =>
  [...projectDetail(projectId), "tasks"] as const;
const taskDetail = (taskId: string) => ["tasks", taskId] as const;

export const queryKeys = {
  users: {
    me: ["users", "me"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: () => ["projects", "list"] as const,
    detail: projectDetail,
    byName: (name: string) => ["projects", "by-name", name] as const,
    completion: (projectId: string) =>
      [...projectDetail(projectId), "completion-status"] as const,
    allTasks: projectAllTasks,
    tasks: (projectId: string, executed?: boolean) =>
      [...projectAllTasks(projectId), executed ?? "all"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    detail: taskDetail,
    predecessors: (taskId: string) =>
      [...taskDetail(taskId), "predecessors"] as const,
    executable: (taskId: string) =>
      [...taskDetail(taskId), "executable"] as const,
  },
  auditLogs: {
    all: ["audit-logs"] as const,
    list: (type?: AuditLogType) => ["audit-logs", type ?? "all"] as const,
    byProjectId: (projectId: string) =>
      ["audit-logs", "project", projectId] as const,
    byProjectName: (name: string) =>
      ["audit-logs", "project-by-name", name] as const,
  },
};
