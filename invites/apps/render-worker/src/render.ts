import { spawn } from "node:child_process";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

export const WEB = process.env.WEB_URL ?? "http://localhost:3000";
export const OUT = process.env.EXPORT_DIR ?? join(process.cwd(), "..", "web", ".data", "exports");
mkdirSync(OUT, { recursive: true });

let browser: Browser | null = null;
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
  return browser;
}

export type Progress = (p: number) => void;
interface Target { inviteCode: string; guest?: string; group?: string; locale?: string }

function renderUrl(t: Target, mode: "autoplay" | "static", at?: number) {
  const q = new URLSearchParams({ mode, tier: "A" });
  if (t.guest) q.set("guest", t.guest);
  if (t.group) q.set("group", t.group);
  if (t.locale) q.set("locale", t.locale);
  if (at !== undefined) q.set("t", String(at));
  if (process.env.RENDER_TOKEN) q.set("token", process.env.RENDER_TOKEN);
  return `${WEB}/render/${t.inviteCode}?${q}`;
}

async function openRender(t: Target, mode: "autoplay" | "static", w: number, h: number, dpr: number, at?: number): Promise<Page> {
  const ctx = await (await getBrowser()).newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(renderUrl(t, mode, at), { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window as unknown as { __inviteReady?: boolean }).__inviteReady === true, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

function ffmpeg(args: string[]): { stdin: NodeJS.WritableStream; done: Promise<void> } {
  const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise<void>((res, rej) => p.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  return { stdin: p.stdin!, done };
}

/** Vertical video 1080×1920 @30 fps, H.264 + AAC, target ≤ 12 MB. Frames come from seek(i / fps). */
export async function renderVideo(t: Target, file: string, onProgress: Progress = () => {}, fps = 30): Promise<{ file: string; duration: number; bytes: number }> {
  const page = await openRender(t, "autoplay", 360, 640, 3);
  const duration = await page.evaluate(() => (window as unknown as { __invite: { storyboard: { duration: number } } }).__invite.storyboard.duration);
  const out = join(OUT, file);
  const frames = Math.round(duration * fps);
  // Audio: silent AAC bed for now (synthesised stings are realtime Web Audio). TODO: offline-render the template's sound score.
  const ff = ffmpeg(["-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-maxrate", "2300k", "-bufsize", "4600k", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", "-t", duration.toFixed(3), out]);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((s) => (window as unknown as { __invite: { seek(t: number): void } }).__invite.seek(s), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 88 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 15 === 0) onProgress(i / frames);
  }
  ff.stdin.end();
  await ff.done;
  await page.context().close();
  onProgress(1);
  return { file: out, duration, bytes: statSync(out).size };
}

export async function renderCard(t: Target, file: string, size: "1080x1350" | "1080x1920" = "1080x1350", type: "png" | "jpeg" = "jpeg"): Promise<string> {
  const [w, h] = size === "1080x1350" ? [360, 450] : [360, 640];
  const page = await openRender(t, "static", w, h, 3);
  const out = join(OUT, file);
  await page.screenshot({ path: out, type, ...(type === "jpeg" ? { quality: 90 } : {}) });
  await page.context().close();
  return out;
}

async function htmlToPng(html: string, w: number, h: number, out: string, dpr = 1) {
  const ctx = await (await getBrowser()).newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: "png" });
  await ctx.close();
  return out;
}

async function htmlToPdf(html: string, out: string, format: "A5" | "A6" = "A5") {
  const ctx = await (await getBrowser()).newContext();
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format, printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
  await ctx.close();
  return out;
}

const fontCss = `@font-face{font-family:"Rozha One";src:url("${WEB}/fonts/rozha-one-latin-400-normal.woff2")}@font-face{font-family:"Rozha One";src:url("${WEB}/fonts/rozha-one-devanagari-400-normal.woff2");unicode-range:U+0900-097F}@font-face{font-family:"Martel";src:url("${WEB}/fonts/martel-latin-400-normal.woff2")}@font-face{font-family:"Martel";src:url("${WEB}/fonts/martel-devanagari-400-normal.woff2");unicode-range:U+0900-097F}`;
const dataUrl = (buf: Buffer, mime: string) => `data:${mime};base64,${buf.toString("base64")}`;

/** A5 print PDF of the static card. */
export async function renderPdf(t: Target, file: string): Promise<string> {
  const img = await renderCard(t, `${file}.tmp.jpg`, "1080x1350");
  const { readFileSync } = await import("node:fs");
  const html = `<html><body style="margin:0"><div style="width:148mm;height:210mm;display:flex;align-items:center;justify-content:center;background:#fff"><img src="${dataUrl(readFileSync(img), "image/jpeg")}" style="width:140mm"></div></body></html>`;
  return htmlToPdf(html, join(OUT, file));
}

/** Printable QR insert: QR ≥ 2.5 cm, dark on light only. Returns PDF and a PNG (used to verify scannability). */
export async function renderQrCard(o: { url: string; names: string; date: string; file: string; qrSvg: string }): Promise<{ pdf: string; png: string }> {
  const html = `<html><head><style>${fontCss}body{margin:0}.c{width:105mm;height:148mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5mm;font-family:Martel,serif;color:#1C1A22;background:#fff;text-align:center}.q{width:42mm;height:42mm}.q svg{width:100%;height:100%}h1{font-family:"Rozha One",serif;font-weight:400;font-size:24pt;margin:0}p{margin:0;font-size:11pt}</style></head>
<body><div class="c"><h1>${esc(o.names)}</h1><p>${esc(o.date)}</p><div class="q">${o.qrSvg}</div><p>Scan for your invitation</p><p style="font-size:9pt;opacity:.7">${esc(o.url.replace(/^https?:\/\//, ""))}</p></div></body></html>`;
  const pdf = await htmlToPdf(html, join(OUT, `${o.file}.pdf`), "A6");
  const png = await htmlToPng(html.replace("width:105mm;height:148mm", "width:397px;height:559px").replace("width:42mm;height:42mm", "width:159px;height:159px"), 397, 559, join(OUT, `${o.file}.png`), 2);
  return { pdf, png };
}

/** Per-guest Open Graph image 1200×630 with personal greeting + template art. */
export async function renderOg(t: Target & { guest: string }, o: { greeting: string; names: string; date: string; file: string }): Promise<string> {
  const art = await renderCard(t, `${o.file}.art.jpg`, "1080x1350");
  const { readFileSync } = await import("node:fs");
  const html = `<html><head><style>${fontCss}body{margin:0}</style></head><body><div style="width:1200px;height:630px;display:flex;background:#141A45;color:#FBF5EA;font-family:Martel,serif">
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 56px;gap:18px"><div style="font-size:40px;line-height:1.2">${esc(o.greeting)}</div>
<div style="font-family:'Rozha One',serif;font-size:76px;line-height:1;color:#E8B64C">${esc(o.names)}</div><div style="font-size:30px;opacity:.9">${esc(o.date)}</div></div>
<img src="${dataUrl(readFileSync(art), "image/jpeg")}" style="height:630px;width:504px;object-fit:cover"></div></body></html>`;
  return htmlToPng(html, 1200, 630, join(OUT, o.file));
}

/** Guest Instagram story image ("We're invited!"), 1080×1920. */
export async function renderStory(t: Target & { guest: string }, o: { label: string; file: string }): Promise<string> {
  const art = await renderCard(t, `${o.file}.art.jpg`, "1080x1920");
  const { readFileSync } = await import("node:fs");
  const html = `<html><head><style>${fontCss}body{margin:0}</style></head><body><div style="position:relative;width:360px;height:640px"><img src="${dataUrl(readFileSync(art), "image/jpeg")}" style="width:100%;height:100%">
<div style="position:absolute;left:0;right:0;top:24px;text-align:center"><span style="background:#fff;color:#1C1A22;font:700 22px Martel,serif;padding:8px 16px;border-radius:999px">${esc(o.label)}</span></div></div></body></html>`;
  return htmlToPng(html, 360, 640, join(OUT, o.file), 3);
}

/** Export an SVG (crest, puppets) as transparent PNG + the SVG itself. */
export async function renderSvgAsset(svg: string, file: string, size = 1200): Promise<{ svg: string; png: string }> {
  const svgPath = join(OUT, `${file}.svg`);
  writeFileSync(svgPath, svg);
  const ctx = await (await getBrowser()).newContext({ viewport: { width: size, height: size } });
  const page = await ctx.newPage();
  await page.setContent(`<html><head><style>${fontCss}@font-face{font-family:"Bodoni Moda";font-style:italic;src:url("${WEB}/fonts/bodoni-moda-latin-400-italic.woff2")}@font-face{font-family:"Tiro Devanagari Hindi";src:url("${WEB}/fonts/tiro-devanagari-hindi-devanagari-400-normal.woff2")}html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;--gold:#B38E55;--gold-hi:#E3C48A;--ink:#2B1B26;--ivory:#F8F3E9}</style></head><body>${svg}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = join(OUT, `${file}.png`);
  await page.screenshot({ path: png, omitBackground: true });
  await ctx.close();
  return { svg: svgPath, png };
}

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }

export async function closeBrowser() { await browser?.close(); browser = null; }
