// Response and request shapes, mirroring the backend (backend/src/database/types.ts, zod/schemas.ts)

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ProjectGoals {
  steps: number;
  cost: number;
}

export interface Project {
  project_id: string;
  name: string;
  budget: number;
  value: number;
  description: string;
  goals: ProjectGoals | null;
  goals_met: boolean | null;
}

export interface Task {
  task_id: string;
  task_name: string;
  description: string;
  cost: number;
  value: number;
  steps: number;
  project: string;
  position: number;
  executed: boolean;
}

// GET /projects/:id/tasks omits the owning project id
export type BoardTask = Omit<Task, "project"> & {
  predecessor_ids: { predecessor_id: string }[];
};

export interface ProjectCompletion {
  project_id: string;
  completed: boolean;
}

// POST /tasks/:id/execute returns only the updated money fields
export type ExecutedTaskProject = Pick<
  Project,
  "project_id" | "budget" | "value"
>;

interface AuditLog {
  log_id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  action_id: number;
  created_at: string;
}

// GET /audit-logs/projects/:id also returns the action name and who did it
export interface ProjectAuditLog extends AuditLog {
  action_name: string;
  first_name: string;
  last_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  budget: number;
  goals?: ProjectGoals;
}

// At least one field must be present (enforced by the backend); goals: null clears them.
// expected_budget = the budget the form was opened with, so a concurrent spend isn't overwritten.
export type EditProjectInput = Partial<
  Omit<CreateProjectInput, "goals"> & {
    goals: ProjectGoals | null;
    expected_budget: number;
  }
>;

export interface EditProjectResponse {
  message: string;
  project: Project;
}

// The backend appends new tasks to the end of the board
export interface CreateTaskInput {
  task_name: string;
  description: string;
  cost: number;
  value: number;
  steps: number;
  project: string;
  predecessor_ids?: string[];
}

// At least one field must be present (enforced by the backend)
export type EditTaskInput = Partial<
  Pick<
    CreateTaskInput,
    "task_name" | "description" | "cost" | "value" | "steps" | "predecessor_ids"
  >
>;

export interface EditTaskResponse {
  message: string;
  task: Task;
}

export interface MoveTaskResponse {
  message: string;
  tasks: BoardTask[];
}

export interface ApiErrorBody {
  message: string;
  errors?: unknown[];
  errorMessages?: string[];
}
