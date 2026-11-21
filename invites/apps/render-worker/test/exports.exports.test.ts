import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { enqueue, jobs } from "../src/jobs";
import { closeBrowser } from "../src/render";

/** Requires the web app on WEB_URL (default http://localhost:3000). Run: pnpm --filter @invites/render-worker test:exports */
async function finish(kind: Parameters<typeof enqueue>[0], params: Record<string, string>) {
  const j = enqueue(kind, params);
  while (jobs.get(j.id)!.status === "queued" || jobs.get(j.id)!.status === "running") await new Promise((r) => setTimeout(r, 500));
  const done = jobs.get(j.id)!;
  expect(done.error).toBeUndefined();
  return done;
}

function probe(file: string) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height:format=duration,size", "-of", "json", file]).toString();
  return JSON.parse(out) as { streams: { codec_name: string; width?: number; height?: number }[]; format: { duration: string; size: string } };
}

const TEMPLATES = (process.env.EXPORT_TEMPLATES ?? "demo,demo-rk,demo-mh").split(",");

describe("exports", () => {
  afterAll(async () => { await closeBrowser(); });

  for (const invite of TEMPLATES) {
    it(`${invite}: vertical video is 1080×1920, 30–45 s, H.264 + AAC, ≤ 12 MB`, async () => {
      const j = await finish("video", { inviteCode: invite });
      const p = probe(j.output!);
      const v = p.streams.find((s) => s.codec_name === "h264")!;
      expect(v.width).toBe(1080); expect(v.height).toBe(1920);
      expect(p.streams.some((s) => s.codec_name === "aac")).toBe(true);
      const d = Number(p.format.duration);
      expect(d).toBeGreaterThanOrEqual(30); expect(d).toBeLessThanOrEqual(45);
      expect(statSync(j.output!).size).toBeLessThanOrEqual(12 * 1024 * 1024);
    });

    it(`${invite}: printable QR card decodes to the invite link`, async () => {
      const j = await finish("qr-card", { inviteCode: invite });
      const png = PNG.sync.read(readFileSync(j.meta!.png as string));
      const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      expect(code?.data).toBe(j.meta!.url);
    });

    it(`${invite}: static cards and OG image have the right sizes`, async () => {
      const card = await finish("card", { inviteCode: invite, size: "1080x1350" });
      const dims = (f: string) => execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]).toString().trim();
      expect(dims(card.output!)).toBe("1080,1350");
      const suffix = invite === "demo" ? "" : invite.slice(5);
      const og = await finish("og", { inviteCode: invite, guest: `riyaFRND2${suffix}` });
      expect(dims(og.output!)).toBe("1200,630");
    });
  }

  it("Mohar crest exports as SVG + transparent PNG", async () => {
    const j = await finish("crest", { inviteCode: "demo-mh" });
    expect(readFileSync(j.meta!.svg as string, "utf8")).toContain("<svg");
    const png = PNG.sync.read(readFileSync(j.output!));
    expect(png.data[3]).toBe(0); // transparent corner
  });
});
