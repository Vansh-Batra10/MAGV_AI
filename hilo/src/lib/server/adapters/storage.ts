import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ENV, MOCK } from "../env";

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

const MIME_BY_EXT: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webm: "audio/webm", mp4: "audio/mp4", m4a: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav" };

class LocalStorage implements StorageAdapter {
  root = path.resolve(ENV.dataDir, "uploads");
  private file(key: string) {
    const safe = key.replace(/[^a-zA-Z0-9/_.-]/g, "").replace(/\.\.+/g, ".");
    return path.join(this.root, safe);
  }
  async put(key: string, data: Buffer) {
    const f = this.file(key);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, data);
  }
  async get(key: string) {
    const f = this.file(key);
    if (!fs.existsSync(f)) return null;
    const ext = f.split(".").pop() ?? "";
    return { data: fs.readFileSync(f), contentType: MIME_BY_EXT[ext] ?? "application/octet-stream" };
  }
  async remove(key: string) {
    fs.rmSync(this.file(key), { force: true });
  }
  publicUrl(key: string) {
    return `/api/media/${key}`;
  }
}

class SupabaseStorage implements StorageAdapter {
  base = `${ENV.supabaseUrl}/storage/v1/object`;
  headers = { Authorization: `Bearer ${ENV.supabaseServiceKey}`, apikey: ENV.supabaseServiceKey };
  async put(key: string, data: Buffer, contentType: string) {
    const res = await fetch(`${this.base}/${ENV.supabaseBucket}/${key}`, { method: "POST", headers: { ...this.headers, "Content-Type": contentType, "x-upsert": "true" }, body: new Uint8Array(data) });
    if (!res.ok) throw new Error(`supabase storage ${res.status}`);
  }
  async get(key: string) {
    const res = await fetch(`${this.base}/${ENV.supabaseBucket}/${key}`, { headers: this.headers });
    if (!res.ok) return null;
    return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
  }
  async remove(key: string) {
    await fetch(`${this.base}/${ENV.supabaseBucket}`, { method: "DELETE", headers: { ...this.headers, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [key] }) });
  }
  publicUrl(key: string) {
    // Bucket is private; media is proxied through our route so unguessable gift access rules apply.
    return `/api/media/${key}`;
  }
}

export const storage: StorageAdapter = MOCK.storage ? new LocalStorage() : new SupabaseStorage();

/** Upload tokens: HMAC-signed, short-lived permission to PUT one key with a size/type limit. */
export function signUpload(key: string, kind: string, maxBytes: number, ttlSec = 600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${key}|${kind}|${maxBytes}|${exp}`;
  const sig = crypto.createHmac("sha256", ENV.authSecret).update(payload).digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyUpload(token: string): { key: string; kind: string; maxBytes: number } | null {
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const payload = Buffer.from(p, "base64url").toString();
  const exp = crypto.createHmac("sha256", ENV.authSecret).update(payload).digest("base64url");
  if (exp.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) return null;
  const [key, kind, max, expAt] = payload.split("|");
  if (Number(expAt) < Date.now() / 1000) return null;
  return { key, kind, maxBytes: Number(max) };
}

export const UPLOAD_LIMITS = {
  photo: { maxBytes: 10 * 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] },
  voice: { maxBytes: 3 * 1024 * 1024, types: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-m4a", "audio/aac", "video/webm"] },
  music: { maxBytes: 8 * 1024 * 1024, types: ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/x-m4a", "audio/aac"] },
  reaction: { maxBytes: 12 * 1024 * 1024, types: ["video/webm", "video/mp4"] },
} as const;
