"use client";
import imageCompression from "browser-image-compression";

export type UploadKind = "photo" | "voice" | "music" | "reaction";

/** Reads EXIF DateTimeOriginal (before we strip it) for auto-ordering photos. Best effort. */
export async function exifDate(file: File): Promise<number | null> {
  try {
    const buf = new Uint8Array(await file.slice(0, 128 * 1024).arrayBuffer());
    const txt = new TextDecoder("latin1").decode(buf);
    const m = txt.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  } catch {
    return null;
  }
}

/** Compress to WebP, max 1600px long edge. Re-encoding strips EXIF/GPS. */
export async function compressPhoto(file: File): Promise<File> {
  const out = await imageCompression(file, { maxWidthOrHeight: 1600, fileType: "image/webp", initialQuality: 0.82, useWebWorker: true, maxSizeMB: 1.2, preserveExif: false });
  return new File([out], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

export async function uploadBlob(blob: Blob, kind: UploadKind, opts: { draftToken?: string; giftId?: string; contribToken?: string } = {}): Promise<string> {
  const mime = blob.type || (kind === "photo" ? "image/webp" : "audio/webm");
  const sign = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, mime, bytes: blob.size, ...opts }),
  });
  if (!sign.ok) throw new Error((await sign.json().catch(() => ({}))).error ?? "upload_sign_failed");
  const { uploadUrl, url } = (await sign.json()) as { uploadUrl: string; url: string };
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": mime }, body: blob });
  if (!put.ok) throw new Error("upload_failed");
  return url;
}

export async function uploadPhotos(files: File[], opts: { draftToken?: string; giftId?: string; contribToken?: string }, onProgress?: (done: number) => void) {
  const dated = await Promise.all(files.map(async (f, i) => ({ f, i, d: await exifDate(f) })));
  // Auto-order by EXIF date when available, otherwise by selection order.
  dated.sort((a, b) => (a.d && b.d ? a.d - b.d : a.i - b.i));
  const urls: string[] = [];
  let done = 0;
  for (const { f } of dated) {
    const c = await compressPhoto(f);
    urls.push(await uploadBlob(c, "photo", opts));
    onProgress?.(++done);
  }
  return urls;
}
