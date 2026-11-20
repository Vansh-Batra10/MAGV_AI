import { q } from "@/lib/server/db";
import { MOCK } from "@/lib/server/env";

export async function GET() {
  await q("select 1");
  return Response.json({ ok: true, mock: MOCK });
}
