import { z } from "zod";
import { body, err, json, limit, sameOrigin } from "@/lib/server/http";
import { signUpload, storage, UPLOAD_LIMITS } from "@/lib/server/adapters/storage";
import { newToken } from "@/lib/ids";

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "audio/webm": "webm", "video/webm": "webm", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "m4a", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav", "video/mp4": "mp4" };
const B = z.object({ kind: z.enum(["photo", "voice", "music", "reaction"]), mime: z.string().max(60), bytes: z.number().int().positive() });

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return err("forbidden", 403);
  if (!(await limit("upload.sign", 120, 3600))) return err("rate_limited", 429);
  const b = await body(req, B);
  if (!b.ok) return b.res;
  const { kind, bytes } = b.data;
  const mime = b.data.mime.split(";")[0].trim().toLowerCase();
  const lim = UPLOAD_LIMITS[kind];
  if (!(lim.types as readonly string[]).includes(mime)) return err("unsupported_type", 415);
  if (bytes > lim.maxBytes) return err("too_large", 413);
  const d = new Date();
  const key = `${kind}/${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}/${newToken()}.${EXT[mime] ?? "bin"}`;
  const token = signUpload(key, mime, lim.maxBytes);
  return json({ key, uploadUrl: `/api/uploads/put?t=${encodeURIComponent(token)}`, url: storage.publicUrl(key) });
}
