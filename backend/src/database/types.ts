import type { ColumnType, Generated, GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely';

export interface UsersTable {
  user_id: Generated<string>;
  first_name: string;
  last_name: string;
  password: string;
  email: string;
}

export type ProjectGoals = { steps: number; cost: number };

export interface ProjectsTable {
  project_id: Generated<string>;
  budget: number;
  value: Generated<number>;
  description: string;
  name: string;
  goals: ColumnType<ProjectGoals | null, ProjectGoals | null | undefined, ProjectGoals | null>;
  goals_met: ColumnType<boolean | null, boolean | null | undefined, boolean | null>;
}

export interface TasksTable {
  task_id: Generated<string>;
  task_name: string;
  description: string;
  cost: number;
  value: number;
  steps: number;
  project: string;
  position: number;
  executed: Generated<boolean>;
}

export interface TaskPredecessorsTable {
  task_id: string;
  predecessor_id: string;
}

export interface TaskActionsTable {
  action_id: GeneratedAlways<number>;
  action_name: string;
  description: string | null;
}

export interface LogsTable {
  log_id: Generated<string>;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  action_id: number;
  created_at: ColumnType<Date, Date | string | undefined, Date | string>;
}

export interface Database {
  'public.users': UsersTable;
  'public.projects': ProjectsTable;
  'public.tasks': TasksTable;
  'public.task_predecessors': TaskPredecessorsTable;
  'audit.task_actions': TaskActionsTable;
  'audit.logs': LogsTable;
}

export type Task = Selectable<TasksTable>;
export type NewTask = Insertable<TasksTable>;
export type TaskUpdate = Updateable<TasksTable>;
export type Project = Selectable<ProjectsTable>;
export type NewProject = Insertable<ProjectsTable>;
export type ProjectUpdate = Updateable<ProjectsTable>;
