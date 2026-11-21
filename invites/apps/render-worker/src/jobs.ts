import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Store, newId, type DbWedding } from "@invites/db";
import { formatDate } from "@invites/i18n";
import { renderCard, renderOg, renderPdf, renderQrCard, renderStory, renderSvgAsset, renderVideo, OUT, WEB } from "./render";

export type JobKind = "video" | "card" | "pdf" | "qr-card" | "og" | "story" | "crest";
export interface Job { id: string; kind: JobKind; params: Record<string, string>; status: "queued" | "running" | "done" | "failed"; progress: number; output?: string; meta?: Record<string, unknown>; error?: string }

const DATA_FILE = process.env.DATA_FILE ?? join(process.cwd(), "..", "web", ".data", "db.json");
/** Read-only view of the store (the web app owns writes). */
export function readStore(): Store { return new Store(existsSync(DATA_FILE) ? DATA_FILE : null); }

function wedding(inviteCode: string): DbWedding {
  const w = readStore().weddingByCode(inviteCode);
  if (!w) throw new Error("wedding not found");
  return w;
}

export const jobs = new Map<string, Job>();
const queue: Job[] = [];
let running = 0;
const MAX = Number(process.env.RENDER_CONCURRENCY ?? 1);

/** Idempotent: the same kind + params returns the existing job if it is queued, running or done. */
export function enqueue(kind: JobKind, params: Record<string, string>): Job {
  const key = createHash("sha1").update(`${kind}:${JSON.stringify(params, Object.keys(params).sort())}`).digest("hex").slice(0, 16);
  const ex = jobs.get(key);
  if (ex && ex.status !== "failed") return ex;
  const j: Job = { id: key, kind, params, status: "queued", progress: 0 };
  jobs.set(key, j);
  queue.push(j);
  void pump();
  return j;
}

async function pump() {
  while (running < MAX && queue.length) {
    const j = queue.shift()!;
    running++;
    run(j).finally(() => { running--; void pump(); });
  }
}

async function run(j: Job, attempt = 1): Promise<void> {
  j.status = "running";
  try {
    const p = j.params;
    const w = wedding(p.inviteCode!);
    const tag = `${w.inviteCode}-${createHash("sha1").update(w.updatedAt + (p.guest ?? "") + (p.group ?? "") + (p.locale ?? "")).digest("hex").slice(0, 8)}`;
    const target = { inviteCode: w.inviteCode, guest: p.guest, group: p.group, locale: p.locale };
    switch (j.kind) {
      case "video": { const r = await renderVideo(target, `video-${tag}.mp4`, (x) => (j.progress = x)); j.output = r.file; j.meta = { duration: r.duration, bytes: r.bytes }; break; }
      case "card": j.output = await renderCard(target, `card-${p.size ?? "1080x1350"}-${tag}.jpg`, (p.size as "1080x1350") ?? "1080x1350"); break;
      case "pdf": j.output = await renderPdf(target, `card-${tag}.pdf`); break;
      case "qr-card": {
        const { loadQr } = await import("@invites/renderer");
        const qr = await loadQr();
        const url = p.guest ? `${process.env.APP_URL ?? WEB}/${w.inviteCode}/${p.guest}` : `${process.env.APP_URL ?? WEB}/${w.inviteCode}`;
        const main = w.content.events.find((e) => e.kind === "wedding") ?? w.content.events[0]!;
        const r = await renderQrCard({ url, names: `${w.content.bride.name} & ${w.content.groom.name}`, date: formatDate(main.startsAt, "en", { tz: main.tz }), file: `qr-${tag}`, qrSvg: qr(url) });
        j.output = r.pdf; j.meta = { png: r.png, url };
        break;
      }
      case "og": {
        const g = readStore().guestBundle(w.inviteCode, p.guest!)!.guest;
        const main = w.content.events.find((e) => e.kind === "wedding" && g.invitedEventIds.includes(e.id)) ?? w.content.events.find((e) => g.invitedEventIds.includes(e.id))!;
        const greeting = g.locale === "en" ? `${g.salutation}, you're invited` : g.locale === "hi" ? `${g.salutation}, आपको निमंत्रण है` : `${g.salutation}, aapko nimantran hai`;
        j.output = await renderOg({ ...target, guest: p.guest! }, { greeting, names: `${w.content.bride.name} & ${w.content.groom.name}`, date: formatDate(main.startsAt, g.locale, { tz: main.tz }), file: `og-${tag}.png` });
        break;
      }
      case "story": j.output = await renderStory({ ...target, guest: p.guest! }, { label: "We're invited! 💌", file: `story-${tag}.png` }); break;
      case "crest": {
        const { crestSvg, CREST_FRAMES } = await import("@invites/template-mohar");
        const b = w.content.order === "groom-first" ? [w.content.groom, w.content.bride] : [w.content.bride, w.content.groom];
        const first = (s: string) => Array.from(new Intl.Segmenter("hi", { granularity: "grapheme" }).segment(s))[0]?.segment ?? "";
        const svg = crestSvg({ a: first(b[0]!.nameHi ?? b[0]!.name), aDeva: !!b[0]!.nameHi, b: first(b[1]!.name), frame: (p.frame as never) ?? CREST_FRAMES[0], id: "crest" }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
        const r = await renderSvgAsset(svg, `crest-${tag}`);
        j.output = r.png; j.meta = { svg: r.svg };
        break;
      }
    }
    j.status = "done"; j.progress = 1;
  } catch (e) {
    if (attempt < 3) return run(j, attempt + 1); // retried
    j.status = "failed"; j.error = e instanceof Error ? e.message : String(e);
  }
}

export function fileOf(j: Job): Buffer | null { return j.output && existsSync(j.output) ? readFileSync(j.output) : null; }
export { OUT, newId };
