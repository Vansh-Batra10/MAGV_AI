import "server-only";
import fs from "node:fs";
import path from "node:path";
import { ENV, MOCK } from "./env";
import { log } from "./log";

type Row = Record<string, any>;
interface Driver {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

const g = globalThis as unknown as { __hiloDb?: Promise<Driver> };

async function makePglite(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.resolve(ENV.dataDir, "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.waitReady;
  return {
    async query(sql, params = []) {
      const r = await pg.query(sql, params as any[]);
      return r.rows as any[];
    },
    async exec(sql) {
      await pg.exec(sql);
    },
  };
}

async function makePg(): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: ENV.databaseUrl, max: 5, ssl: ENV.databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false } });
  return {
    async query(sql, params = []) {
      const r = await pool.query(sql, params as any[]);
      return r.rows;
    },
    async exec(sql) {
      await pool.query(sql);
    },
  };
}

async function migrate(d: Driver) {
  await d.exec(`create table if not exists _migrations (name text primary key, applied_at timestamptz default now())`);
  const dir = path.resolve(process.cwd(), "supabase/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const done = new Set((await d.query<{ name: string }>(`select name from _migrations`)).map((r) => r.name));
  for (const f of files) {
    if (done.has(f)) continue;
    if (f.includes(".supabase.") && MOCK.db) continue; // RLS needs auth.uid()
    await d.exec(fs.readFileSync(path.join(dir, f), "utf8"));
    await d.query(`insert into _migrations(name) values ($1)`, [f]);
    log.info("db.migrated", { file: f });
  }
}

function getDriver(): Promise<Driver> {
  if (!g.__hiloDb) {
    g.__hiloDb = (async () => {
      const d = MOCK.db ? await makePglite() : await makePg();
      await migrate(d);
      return d;
    })().catch((err) => {
      g.__hiloDb = undefined;
      throw err;
    });
  }
  return g.__hiloDb;
}

/** Serialise JS objects for jsonb params. */
function prep(params: unknown[]) {
  return params.map((p) => (p !== null && typeof p === "object" && !(p instanceof Date) ? JSON.stringify(p) : p));
}

let chain: Promise<unknown> = Promise.resolve();

export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const d = await getDriver();
  if (!MOCK.db) return d.query<T>(sql, prep(params));
  // PGlite is single-connection: serialise queries.
  const run = chain.then(() => d.query<T>(sql, prep(params)));
  chain = run.catch(() => undefined);
  return run;
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}
