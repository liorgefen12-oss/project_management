import type { Pool } from 'pg';

export interface SessionStore {
  get(key: string, maxAge: number, options: { rolling: boolean }): Promise<unknown>;
  set(key: string, session: unknown, maxAge: number, options: { rolling: boolean; changed: boolean }): Promise<void>;
  destroy(key: string, options: object): Promise<void>;
}

const PRUNE_INTERVAL_MS = 15 * 60 * 1000;

// Uses the same "session" table layout as connect-pg-simple, so the existing table can be reused.
export class PgSessionStore implements SessionStore {
  private ready: Promise<void> | undefined;

  constructor(private readonly pool: Pool) {
    setInterval(() => {
      void this.prune().catch((error: unknown) => console.error('Session prune failed', error));
    }, PRUNE_INTERVAL_MS).unref();
  }

  async get(key: string): Promise<unknown> {
    await this.ensureTable();
    const result = await this.pool.query<{ sess: unknown }>(
      'SELECT sess FROM "session" WHERE sid = $1 AND expire > NOW()',
      [key]
    );
    return result.rows[0]?.sess;
  }

  async set(key: string, session: unknown, maxAge: number): Promise<void> {
    await this.ensureTable();
    await this.pool.query(
      `INSERT INTO "session" (sid, sess, expire)
       VALUES ($1, $2, to_timestamp($3))
       ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
      [key, JSON.stringify(session), (Date.now() + maxAge) / 1000]
    );
  }

  async destroy(key: string): Promise<void> {
    await this.ensureTable();
    await this.pool.query('DELETE FROM "session" WHERE sid = $1', [key]);
  }

  private async prune(): Promise<void> {
    await this.ensureTable();
    await this.pool.query('DELETE FROM "session" WHERE expire < NOW()');
  }

  private ensureTable(): Promise<void> {
    this.ready ??= this.pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `).then(
      () => undefined,
      (error: unknown) => {
        this.ready = undefined;
        throw error;
      }
    );
    return this.ready;
  }
}
