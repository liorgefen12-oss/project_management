// validation/schemas.ts
import { z } from "zod";

const uuid = z.string().uuid();

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .regex(/^[^@\s]+@outlook\.com$/i, "Must be an @outlook.com email"),
  password: z.string().min(1, "Password is required"),
});
export const idParamSchema = z.object({ id: z.string().uuid() });

export const moveTaskSchema = z.object({
  position: z.number().int().nonnegative(),
});

export const createTaskSchema = z.object({
  task_name: z.string().trim().min(1).max(50),
  description: z.string().max(250),
  cost: z.number().int().nonnegative(),
  value: z.number().int().nonnegative(),
  steps: z.number().int().positive(),
  predecessor: uuid.nullable().optional(),
  project: uuid,
});

// For edits, every field is optional, but at least one must be present
export const updateTaskSchema = createTaskSchema
  .omit({ project: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");
