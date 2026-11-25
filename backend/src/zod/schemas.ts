import { z } from "zod";
import { messages } from "../messages.js";

const uuid = z.uuid().transform((id) => id.toLowerCase());

export const loginSchema = z.object({
  email: z
    .email()
    .regex(/^[^@\s]+@outlook\.com$/i, messages[400].outlookEmailRequired),
  password: z.string().min(1, messages[400].passwordRequired),
});
export const idParamSchema = z.object({ id: uuid });
export const projectNameQuerySchema = z.object({
  name: z.string().trim().min(1),
});

// Full request schemas, as expected by the validate middleware
export const loginRequestSchema = z.object({ body: loginSchema });
export const idRequestSchema = z.object({ params: idParamSchema });
export const projectNameRequestSchema = z.object({
  query: projectNameQuerySchema,
});

export const auditLogsRequestSchema = z.object({
  query: z.object({
    type: z.enum(["user-logins", "project-sign-ins-and-outs"]).optional(),
  }),
});

export const projectTasksRequestSchema = z.object({
  params: idParamSchema,
  query: z.object({
    executed: z.enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  }),
});

export const moveTaskSchema = z.object({
  position: z.number().int().positive(),
}).strict();

const projectGoalsSchema = z.object({
  steps: z.number().int().nonnegative(),
  cost: z.number().int().nonnegative(),
}).strict();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().max(250),
  budget: z.number().int().nonnegative(),
  goals: projectGoalsSchema.optional(),
});

export const createTaskSchema = z.object({
  task_name: z.string().trim().min(1).max(50),
  description: z.string().max(250),
  cost: z.number().int().nonnegative(),
  value: z.number().int().nonnegative(),
  steps: z.number().int().positive(),
  position: z.number().int().positive(),
  predecessor_ids: z
    .array(uuid)
    .refine((ids) => new Set(ids).size === ids.length, messages[400].duplicatePredecessors)
    .optional(),
  project: uuid,
}).strict();

export const createProjectRequestSchema = z.object({
  body: createProjectSchema,
});

// For edits, every field is optional (goals: null clears them), but at least one must be present
export const updateProjectSchema = createProjectSchema
  .extend({ goals: projectGoalsSchema.nullable() })
  .partial()
  .strict()
  .refine((d) => Object.values(d).some((value) => value !== undefined), messages[400].nothingToUpdate);

export const updateProjectRequestSchema = z.object({
  params: idParamSchema,
  body: updateProjectSchema,
});
export const createTaskRequestSchema = z.object({ body: createTaskSchema });

// For edits, every field is optional, but at least one must be present
export const updateTaskSchema = createTaskSchema
  .omit({ project: true, position: true })
  .partial()
  .refine((d) => Object.values(d).some((value) => value !== undefined), messages[400].nothingToUpdate);

export const updateTaskRequestSchema = z.object({
  params: idParamSchema,
  body: updateTaskSchema,
});
export const moveTaskRequestSchema = z.object({
  params: idParamSchema,
  body: moveTaskSchema,
});
