import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { encodePng, type Img } from "./provider";

/** Decode our own (or any 8-bit RGBA, non-interlaced) PNG into RGBA pixels. */
export function decodePng(buf: Buffer): { w: number; h: number; px: Uint8Array } {
  let o = 8; let w = 0, h = 0; const idat: Buffer[] = []; let ct = 6;
  while (o < buf.length) {
    const len = buf.readUInt32BE(o); const type = buf.toString("ascii", o + 4, o + 8); const data = buf.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]!; }
    if (type === "IDAT") idat.push(data);
    o += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3; const raw = inflateSync(Buffer.concat(idat)); const px = new Uint8Array(w * h * 4); const stride = w * bpp;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]!; const line = new Uint8Array(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp]! : 0, b = prev[i]!, c = i >= bpp ? prev[i - bpp]! : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      line[i] = (line[i]! + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0)) & 255;
    }
    for (let x = 0; x < w; x++) { const s = x * bpp, d = (y * w + x) * 4; px[d] = line[s]!; px[d + 1] = line[s + 1]!; px[d + 2] = line[s + 2]!; px[d + 3] = bpp === 4 ? line[s + 3]! : 255; }
    prev = line;
  }
  return { w, h, px };
}

/** 1 px matte choke: erode the alpha edge so cut-outs have clean borders. */
export function chokeAlpha(img: Img): Img {
  const { w, h, px } = decodePng(img.png);
  const out = new Uint8Array(px);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4 + 3;
    out[i] = Math.min(px[i]!, px[i - 4]!, px[i + 4]!, px[i - w * 4]!, px[i + w * 4]!);
  }
  return { ...img, png: encodePng(out, w, h) };
}

/** Nudge every pixel 15% toward its nearest pack palette colour (keeps generated art on-brand). */
export function harmonise(img: Img, palette: string[], amount = 0.15): Img {
  const pal = palette.map((h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; });
  const { w, h, px } = decodePng(img.png);
  for (let i = 0; i < px.length; i += 4) {
    let best = pal[0]!, bd = Infinity;
    for (const c of pal) { const d = (px[i]! - c[0]) ** 2 + (px[i + 1]! - c[1]) ** 2 + (px[i + 2]! - c[2]) ** 2; if (d < bd) { bd = d; best = c; } }
    for (let k = 0; k < 3; k++) px[i + k] = px[i + k]! + (best[k]! - px[i + k]!) * amount;
  }
  return { ...img, png: encodePng(px, w, h) };
}

export interface Variant { width: number; format: "avif" | "webp" | "png"; file: string; bytes: number }

/** AVIF + WebP at 720/1080/1440 widths (never upscaling), via ffmpeg (libaom-av1 / libwebp). */
export function variants(img: Img, dir: string, base: string): Variant[] {
  mkdirSync(dir, { recursive: true });
  const src = join(dir, `${base}.png`);
  writeFileSync(src, img.png);
  const out: Variant[] = [{ width: img.w, format: "png", file: src, bytes: statSync(src).size }];
  const widths = [720, 1080, 1440].filter((x) => x <= img.w);
  for (const width of widths.length ? widths : [img.w - (img.w % 2)]) {
    for (const format of ["webp", "avif"] as const) {
      const file = join(dir, `${base}-${width}.${format}`);
      const codec = format === "webp" ? ["-c:v", "libwebp", "-quality", "82", ...(img.alpha ? ["-pix_fmt", "yuva420p"] : [])] : ["-c:v", "libaom-av1", "-still-picture", "1", "-crf", "32", "-cpu-used", "6", ...(img.alpha ? ["-pix_fmt", "yuva420p"] : ["-pix_fmt", "yuv420p"])];
      execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-vf", `scale=${width}:-2`, ...codec, file]);
      out.push({ width, format, file, bytes: statSync(file).size });
    }
  }
  return out;
}

export interface CheckResult { name: string; ok: boolean | "manual"; detail?: string }

/** Automatic gate. OCR needs tesseract in the worker image; without it the text check is left for manual review. */
export function autoChecks(img: Img, spec: { alpha: boolean; maxBytes: number; size: { w: number; h: number } }, vs: Variant[]): CheckResult[] {
  const { w, h, px } = decodePng(img.png);
  let transparent = 0; for (let i = 3; i < px.length; i += 4) if (px[i]! < 10) transparent++;
  const best = vs.filter((v) => v.format === "avif").sort((a, b) => b.width - a.width)[0];
  let hasOcr = false; try { execFileSync("which", ["tesseract"]); hasOcr = true; } catch { /* no OCR */ }
  return [
    { name: "size", ok: w === spec.size.w && h === spec.size.h, detail: `${w}x${h}` },
    { name: "alpha", ok: spec.alpha ? transparent / (w * h) > 0.02 : true, detail: `${((transparent / (w * h)) * 100).toFixed(1)}% transparent` },
    { name: "byte budget", ok: !best || !spec.maxBytes || best.bytes <= spec.maxBytes, detail: best ? `${Math.round(best.bytes / 1024)} KB avif @${best.width}` : "" },
    ocrCheck(img, hasOcr),
  ];
}
function ocrCheck(img: Img, hasOcr: boolean): CheckResult {
  if (!hasOcr) return { name: "no stray text (OCR)", ok: "manual", detail: "OCR unavailable: review manually" };
  const f = `/tmp/ocr-${process.pid}-${Date.now()}.png`;
  writeFileSync(f, img.png);
  const text = execFileSync("tesseract", [f, "stdout", "--psm", "11"], { stdio: ["ignore", "pipe", "ignore"] }).toString();
  const words = text.split(/\s+/).filter((x) => /\p{L}{3,}/u.test(x));
  return { name: "no stray text (OCR)", ok: words.length === 0, detail: words.slice(0, 5).join(" ") };
}
export { readFileSync };
