// Retention job (run daily): anonymise guest PII 90 days after a wedding's last function unless extended (§24).
// usage: node scripts/retention.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const file = process.env.DATA_FILE ?? join(process.cwd(), ".data", "db.json");
const dry = process.argv.includes("--dry");
const db = JSON.parse(readFileSync(file, "utf8"));
const now = Date.now();
let n = 0;
for (const w of db.weddings) {
  const last = Math.max(...w.content.events.map((e) => Date.parse(e.endsAt ?? e.startsAt)));
  const keepUntil = w.retainUntil ? Date.parse(w.retainUntil) : last + 90 * 86400_000;
  if (now < keepUntil) continue;
  for (const g of db.guests.filter((x) => x.weddingId === w.id && !x.anonymised)) {
    Object.assign(g, { salutation: "Guest", shortName: undefined, phone: undefined, email: undefined, note: undefined, anonymised: true });
    n++;
  }
  for (const r of db.rsvps.filter((x) => x.weddingId === w.id)) { r.submission.message = undefined; r.submission.allergies = undefined; r.submission.refNo = undefined; }
  for (const b of db.blessings.filter((x) => x.weddingId === w.id)) b.signatureSvg = undefined;
}
if (!dry) writeFileSync(file, JSON.stringify(db));
console.log(`${dry ? "[dry] " : ""}anonymised ${n} guests`);
