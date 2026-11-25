import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  FRONTEND_ORIGIN: z.url().default('http://localhost:5173'),
  // Unset = secure cookies only in production. Set "false" when serving production over plain HTTP.
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  // Set "true" only when running behind a reverse proxy (nginx) that sets X-Forwarded-* headers
  TRUST_PROXY: z.enum(['true', 'false']).transform((value) => value === 'true').default(false)
});

export function loadEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  return environmentSchema.parse(environment);
}
