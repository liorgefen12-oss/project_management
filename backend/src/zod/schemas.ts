import { z } from "zod";
import { messages } from "../messages.js";

const uuid = z.uuid().transform((id) => id.toLowerCase());

// PostgreSQL `integer` columns are 32-bit
export const MAX_DB_INTEGER = 2_147_483_647;
const dbInteger = () => z.number().int().max(MAX_DB_INTEGER);

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
  position: dbInteger().positive(),
}).strict();

const projectGoalsSchema = z.object({
  steps: dbInteger().nonnegative(),
  cost: dbInteger().nonnegative(),
}).strict();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().max(250),
  budget: dbInteger().nonnegative(),
  goals: projectGoalsSchema.optional(),
});

// The position is assigned by the server (appended to the end of the board)
export const createTaskSchema = z.object({
  task_name: z.string().trim().min(1).max(50),
  description: z.string().max(250),
  cost: dbInteger().nonnegative(),
  value: dbInteger().nonnegative(),
  steps: dbInteger().positive(),
  predecessor_ids: z
    .array(uuid)
    .refine((ids) => new Set(ids).size === ids.length, messages[400].duplicatePredecessors)
    .optional(),
  project: uuid,
}).strict();

export const createProjectRequestSchema = z.object({
  body: createProjectSchema,
});

// For edits, every field is optional (goals: null clears them), but at least one must be present.
// expected_budget is the budget the client last saw; a budget edit is rejected if it has changed since.
export const updateProjectSchema = createProjectSchema
  .extend({ goals: projectGoalsSchema.nullable() })
  .partial()
  .extend({ expected_budget: dbInteger().nonnegative().optional() })
  .strict()
  .refine(
    ({ expected_budget: _, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined),
    messages[400].nothingToUpdate,
  )
  .refine(
    (d) => d.expected_budget === undefined || d.budget !== undefined,
    { message: messages[400].expectedBudgetWithoutBudget, path: ["expected_budget"] },
  );

export const updateProjectRequestSchema = z.object({
  params: idParamSchema,
  body: updateProjectSchema,
});
export const createTaskRequestSchema = z.object({ body: createTaskSchema });

// For edits, every field is optional, but at least one must be present
export const updateTaskSchema = createTaskSchema
  .omit({ project: true })
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
