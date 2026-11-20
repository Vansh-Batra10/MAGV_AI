import { err, json } from "@/lib/server/http";
import { storage, verifyUpload } from "@/lib/server/adapters/storage";

export async function PUT(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const v = verifyUpload(t);
  if (!v) return err("bad_token", 403);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > v.maxBytes) return err("too_large", 413);
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > v.maxBytes || buf.length === 0) return err("too_large", 413);
  // `kind` field carries the signed mime type.
  await storage.put(v.key, buf, v.kind);
  return json({ ok: true, url: storage.publicUrl(v.key) });
}
