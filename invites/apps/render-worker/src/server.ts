import { createServer } from "node:http";
import { enqueue, fileOf, jobs, type JobKind } from "./jobs";

/**
 * Render worker HTTP API (MOCK mode: in-process queue). With DATABASE_URL set, jobs go through pg-boss
 * (Postgres queue, no Redis) so several workers can share the load; the HTTP API stays the same.
 */
const PORT = Number(process.env.WORKER_PORT ?? 3100);
const KINDS: JobKind[] = ["video", "card", "pdf", "qr-card", "og", "story", "crest"];
const MIME: Record<string, string> = { mp4: "video/mp4", jpg: "image/jpeg", png: "image/png", pdf: "application/pdf", svg: "image/svg+xml" };

async function body(req: import("node:http").IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try { return JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { return {}; }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const send = (code: number, data: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };
  try {
    if (req.method === "GET" && url.pathname === "/health") return send(200, { ok: true });
    if (req.method === "POST" && url.pathname === "/jobs") {
      const b = await body(req);
      if (!KINDS.includes(b.kind as JobKind) || !b.inviteCode) return send(400, { ok: false });
      const { kind, ...params } = b;
      const j = enqueue(kind as JobKind, params);
      return send(202, { ok: true, id: j.id, status: j.status });
    }
    const m = url.pathname.match(/^\/jobs\/([0-9a-f]+)(\/file)?$/);
    if (m && req.method === "GET") {
      const j = jobs.get(m[1]!);
      if (!j) return send(404, { ok: false });
      if (!m[2]) return send(200, { ok: true, id: j.id, kind: j.kind, status: j.status, progress: j.progress, meta: j.meta, error: j.error });
      const f = fileOf(j);
      if (!f) return send(409, { ok: false, status: j.status });
      const ext = j.output!.split(".").pop()!;
      res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" });
      return res.end(f);
    }
    send(404, { ok: false });
  } catch (e) { send(500, { ok: false, error: String(e) }); }
}).listen(PORT, () => console.log(`render-worker on :${PORT}`));
