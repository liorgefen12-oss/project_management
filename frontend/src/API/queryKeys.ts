// Keys are hierarchical so invalidating a prefix (e.g. projects.detail(id))
// also refreshes everything nested under it (its tasks, completion, ...).
const projectDetail = (projectId: string) => ["projects", projectId] as const;
const taskDetail = (taskId: string) => ["tasks", taskId] as const;

export const queryKeys = {
  users: {
    me: ["users", "me"] as const,
  },
  projects: {
    list: () => ["projects", "list"] as const,
    detail: projectDetail,
    completion: (projectId: string) =>
      [...projectDetail(projectId), "completion-status"] as const,
    tasks: (projectId: string) =>
      [...projectDetail(projectId), "tasks"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    detail: taskDetail,
  },
  auditLogs: {
    all: ["audit-logs"] as const,
    byProjectId: (projectId: string) =>
      ["audit-logs", "project", projectId] as const,
  },
};
