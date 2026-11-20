import { storage } from "@/lib/server/adapters/storage";

/** Media proxy. Keys are 20-char random tokens; unguessable like gift slugs. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^(photo|voice|music|reaction)\/\d{6}\/[A-Za-z0-9]{20}\.\w{2,4}$/.test(key)) return new Response("not found", { status: 404 });
  const f = await storage.get(key);
  if (!f) return new Response("not found", { status: 404 });
  const size = f.data.length;
  const range = req.headers.get("range");
  const headers: Record<string, string> = { "Content-Type": f.contentType, "Cache-Control": "private, max-age=31536000, immutable", "Accept-Ranges": "bytes", "X-Robots-Tag": "noindex" };
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    const start = m?.[1] ? Number(m[1]) : 0;
    const end = m?.[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    return new Response(new Uint8Array(f.data.subarray(start, end + 1)), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(new Uint8Array(f.data), { headers: { ...headers, "Content-Length": String(size) } });
}
