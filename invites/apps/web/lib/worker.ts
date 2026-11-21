const WORKER = process.env.WORKER_URL ?? "http://localhost:3100";

/** Ask the render worker for an export and wait for it (idempotent: the same request reuses the job). */
export async function renderViaWorker(params: Record<string, string>, timeoutMs = 600_000): Promise<Response> {
  let job: { id: string };
  try {
    job = await fetch(`${WORKER}/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params) }).then((r) => r.json());
  } catch { return new Response("Render worker is not running (pnpm --filter @invites/render-worker dev)", { status: 503 }); }
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await fetch(`${WORKER}/jobs/${job.id}`).then((r) => r.json());
    if (s.status === "done") {
      const f = await fetch(`${WORKER}/jobs/${job.id}/file`);
      return new Response(f.body, { headers: { "content-type": f.headers.get("content-type") ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
    }
    if (s.status === "failed") return new Response(`Render failed: ${s.error}`, { status: 500 });
    await new Promise((r) => setTimeout(r, 800));
  }
  return new Response("Still rendering, try again in a minute", { status: 202 });
}
