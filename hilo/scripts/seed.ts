/** Seeds demo data in MOCK mode: a launch coupon and an admin profile. Run with the dev server stopped or running. */
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

(async () => {
  if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL set — seed real DBs via Supabase SQL editor instead.");
    return;
  }
  const dir = path.resolve(process.env.HILO_DATA_DIR ?? "node_modules/.cache/hilo-data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.exec(`create table if not exists _migrations (name text primary key, applied_at timestamptz default now())`);
  for (const f of fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql") && !f.includes(".supabase.")).sort()) {
    const done = await db.query(`select 1 from _migrations where name=$1`, [f]);
    if (!done.rows.length) {
      await db.exec(fs.readFileSync(path.join("supabase/migrations", f), "utf8"));
      await db.query(`insert into _migrations(name) values ($1)`, [f]);
    }
  }
  await db.query(`insert into coupons (code, percent_off, valid_to, max_uses) values ('LAUNCH10', 10, now() + interval '60 days', 500) on conflict do nothing`);
  await db.query(`insert into profiles (id, email, referral_code, market, currency) values ('admin', 'admin@hilo.example', 'ADMIN001', 'IN', 'INR') on conflict do nothing`);
  console.log("✓ seeded: coupon LAUNCH10 (10% off, real expiry), admin@hilo.example");
  await db.close();
})();
