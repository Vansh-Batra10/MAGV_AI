import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assets, requireAdmin } from "@/lib/admin";
import { store } from "@/lib/store";

type P = { params: Promise<{ rest: string[] }> };
const no = () => NextResponse.json({ ok: false }, { status: 403 });

export async function GET(req: Request, { params }: P) {
  if (!(await requireAdmin())) return no();
  const path = (await params).rest.join("/");
  const a = await assets();
  if (path === "overview") {
    const db = store().raw();
    return NextResponse.json({
      ok: true, assets: a.readManifest(), reports: db.reports, orders: db.orders.slice(-50),
      metrics: { weddings: db.weddings.length, published: db.weddings.filter((w) => w.status === "published").length, guests: db.guests.length, opened: db.guests.filter((g) => g.firstOpenedAt).length, rsvps: db.rsvps.length, paid: db.orders.filter((o) => o.status === "paid").length },
    });
  }
  if (path === "file") {
    const f = resolve(new URL(req.url).searchParams.get("p") ?? "");
    const root = resolve(process.env.ASSET_DIR!);
    if (!f.startsWith(root + "/")) return no();
    const ext = f.split(".").pop()!;
    return new Response(readFileSync(f), { headers: { "content-type": { png: "image/png", webp: "image/webp", avif: "image/avif" }[ext] ?? "application/octet-stream" } });
  }
  return NextResponse.json({ ok: false }, { status: 404 });
}

export async function POST(req: Request, { params }: P) {
  if (!(await requireAdmin())) return no();
  const path = (await params).rest.join("/");
  const body = await req.json().catch(() => ({}));
  const a = await assets();
  try {
    if (path === "generate") {
      const b = z.object({ template: z.string(), pack: z.string(), slot: z.string(), seed: z.number().int().optional() }).parse(body);
      return NextResponse.json({ ok: true, asset: await a.generateSlot(b) });
    }
    if (path === "review") {
      const b = z.object({ id: z.string(), decision: z.enum(["approved", "rejected"]) }).parse(body);
      return NextResponse.json({ ok: true, asset: a.review(b.id, b.decision) });
    }
    if (path === "takedown") {
      const b = z.object({ reportId: z.string(), action: z.enum(["takedown", "dismiss"]) }).parse(body);
      const db = store().raw();
      const r = db.reports.find((x) => x.id === b.reportId);
      if (!r) return NextResponse.json({ ok: false }, { status: 404 });
      r.status = "closed";
      if (b.action === "takedown") { const w = db.weddings.find((x) => x.id === r.weddingId); if (w) w.status = "archived"; }
      store().flush();
      return NextResponse.json({ ok: true });
    }
    if (path === "rig") {
      // Puppet rigging tool output: part polygons + pivots (rig JSON). Part PNGs are cut client-side and uploaded later.
      const b = z.object({ name: z.string().max(60), parts: z.array(z.object({ id: z.string(), polygon: z.array(z.tuple([z.number(), z.number()])).min(3), pivot: z.tuple([z.number(), z.number()]), parent: z.string().optional() })) }).parse(body);
      const { writeFileSync, mkdirSync } = await import("node:fs");
      mkdirSync(`${process.env.ASSET_DIR}/rigs`, { recursive: true });
      writeFileSync(`${process.env.ASSET_DIR}/rigs/${b.name.replace(/[^a-z0-9-]/gi, "_")}.json`, JSON.stringify(b, null, 2));
      return NextResponse.json({ ok: true });
    }
  } catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 }); }
  return NextResponse.json({ ok: false }, { status: 404 });
}
