import { deflateSync } from "node:zlib";

export interface Size { w: number; h: number }
export interface Img { png: Buffer; w: number; h: number; alpha: boolean }

export interface ImageProvider {
  name: string;
  generate(p: { prompt: string; refs?: Img[]; size: Size; seed?: number; alpha?: boolean }): Promise<Img>;
  edit(p: { image: Img; mask?: Img; prompt: string; refs?: Img[] }): Promise<Img>;
  removeBackground(img: Img): Promise<Img>;
  upscale(img: Img, factor: 2 | 4): Promise<Img>;
}

// ---- tiny PNG encoder (RGBA) so the MOCK provider needs no native deps ----
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b: Buffer) { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Buffer) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
export function encodePng(rgba: Uint8Array, w: number, h: number): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0))]);
}

function hash(s: string) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hexToRgb(h: string): [number, number, number] { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

/**
 * MOCK provider: procedural placeholder art composed with care — a palette gradient, soft layered arches and a
 * vignette, with alpha outside an arch silhouette when the slot needs alpha. Deterministic per (prompt, seed).
 */
export class MockProvider implements ImageProvider {
  name = "mock";
  constructor(private palette: string[] = ["#222A5E", "#E2B07E", "#F3A23A", "#FBF5EA"]) {}
  async generate(p: { prompt: string; size: Size; seed?: number; alpha?: boolean }): Promise<Img> {
    const { w, h } = p.size;
    const seed = hash(p.prompt) ^ (p.seed ?? 0);
    const [c0, c1, c2] = [hexToRgb(this.palette[0]!), hexToRgb(this.palette[1]!), hexToRgb(this.palette[2]!)];
    const px = new Uint8Array(w * h * 4);
    const arches = 3 + (seed % 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = y / h, i = (y * w + x) * 4;
      const g = u < 0.6 ? u / 0.6 : 1;
      let r = c0[0] + (c1[0] - c0[0]) * g, gg = c0[1] + (c1[1] - c0[1]) * g, b = c0[2] + (c1[2] - c0[2]) * g;
      // layered arches
      const ax = (x / w) * arches, cell = ax - Math.floor(ax), dx = Math.abs(cell - 0.5) * 2;
      const archTop = 0.45 + 0.18 * Math.sqrt(Math.max(0, 1 - dx * dx));
      if (u > 1 - archTop && dx < 0.8) { r = r * 0.6 + c2[0] * 0.4; gg = gg * 0.6 + c2[1] * 0.4; b = b * 0.6 + c2[2] * 0.4; }
      const vig = 1 - 0.35 * Math.hypot(x / w - 0.5, u - 0.5);
      px[i] = r * vig; px[i + 1] = gg * vig; px[i + 2] = b * vig;
      // alpha: keep a centred arch silhouette
      const inside = Math.abs(x / w - 0.5) < 0.42 && (u > 0.18 || Math.hypot((x / w - 0.5) / 0.42, (u - 0.18) / 0.16) < 1);
      px[i + 3] = p.alpha ? (inside ? 255 : 0) : 255;
    }
    return { png: encodePng(px, w, h), w, h, alpha: !!p.alpha };
  }
  async edit(p: { image: Img; prompt: string }) { return p.image; }
  async removeBackground(img: Img) { return { ...img, alpha: true }; }
  async upscale(img: Img) { return img; }
}

/**
 * Real providers are selected by IMAGE_PROVIDER. TODO_VERIFY(current model names, pricing and terms) before
 * enabling any; no provider is called in MOCK mode.
 */
export function providerFromEnv(palette?: string[]): ImageProvider {
  const name = process.env.IMAGE_PROVIDER ?? "mock";
  if (name === "mock" || process.env.MOCK_MODE !== "false") return new MockProvider(palette);
  throw new Error(`Image provider "${name}" is not configured yet (see docs/VERIFY.md #11)`);
}
