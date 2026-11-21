import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TemplateModule } from "@invites/renderer";
import { loadPrompt, lintPrompt } from "./prompts";
import { autoChecks, chokeAlpha, harmonise, variants, type CheckResult, type Variant } from "./postprocess";
import { providerFromEnv, type ImageProvider } from "./provider";

export interface AssetRecord {
  id: string; scope: "pack" | "wedding"; ownerId: string; template: string; pack: string; slot: string; source: "ai" | "manual" | "procedural";
  provider: string; prompt: string; variants: Variant[]; checks: CheckResult[]; review: "pending" | "approved" | "rejected"; createdAt: string; consent?: boolean;
}

export const ASSET_DIR = process.env.ASSET_DIR ?? join(process.cwd(), "apps", "web", ".data", "assets");
const MANIFEST = () => join(ASSET_DIR, "assets.json");
export function readManifest(): AssetRecord[] { return existsSync(MANIFEST()) ? JSON.parse(readFileSync(MANIFEST(), "utf8")) : []; }
export function writeManifest(a: AssetRecord[]) { mkdirSync(ASSET_DIR, { recursive: true }); writeFileSync(MANIFEST(), JSON.stringify(a, null, 2)); }

export async function loadTemplate(id: string): Promise<TemplateModule> {
  if (id === "sheesh-mahal") return (await import("@invites/template-sheesh-mahal")).default;
  if (id === "rang-kahani") return (await import("@invites/template-rang-kahani")).default;
  if (id === "mohar") return (await import("@invites/template-mohar")).default;
  throw new Error(`unknown template ${id}`);
}

/** Generate → post-process → automatic checks → variants → pending review. Nothing reaches a guest until approved. */
export async function generateSlot(o: { template: string; pack: string; slot: string; scope?: "pack" | "wedding"; ownerId?: string; seed?: number; provider?: ImageProvider; consent?: boolean }): Promise<AssetRecord> {
  const tpl = await loadTemplate(o.template);
  const slot = tpl.manifest.slots.find((s) => s.id === o.slot);
  if (!slot) throw new Error(`no slot ${o.slot}`);
  const spec = loadPrompt(o.template, o.pack, o.slot);
  if (!spec) throw new Error(`no prompt template for ${o.template}/${o.pack}/${o.slot}`);
  const lint = lintPrompt(spec.text);
  if (lint.length) throw new Error(`prompt lint: ${lint.join(", ")}`);
  if (spec.personal && !o.consent) throw new Error("personal assets need the couple's explicit consent");
  const tokens = tpl.packs[o.pack]?.tokens ?? {};
  const palette = Object.values(tokens).filter((v) => /^#[0-9a-fA-F]{6}$/.test(v));
  const provider = o.provider ?? providerFromEnv(palette);
  let img = await provider.generate({ prompt: spec.text, size: spec.size, seed: o.seed ?? 7, alpha: spec.alpha || slot.alphaRequired });
  if (slot.alphaRequired && !img.alpha) img = await provider.removeBackground(img);
  if (img.alpha) img = chokeAlpha(img);
  img = harmonise(img, palette.length ? palette : ["#888888"]);
  const id = `${o.template}.${o.pack}.${o.slot}.${o.scope ?? "pack"}.${o.ownerId ?? "lib"}`;
  const dir = join(ASSET_DIR, o.scope ?? "pack", o.ownerId ?? "lib", o.template, o.pack);
  const vs = variants(img, dir, o.slot);
  const rec: AssetRecord = {
    id, scope: o.scope ?? "pack", ownerId: o.ownerId ?? "lib", template: o.template, pack: o.pack, slot: o.slot, source: "ai", provider: provider.name,
    prompt: spec.text, variants: vs, checks: autoChecks(img, { alpha: slot.alphaRequired, maxBytes: slot.maxBytes, size: spec.size }, vs), review: "pending", createdAt: new Date().toISOString(), consent: o.consent,
  };
  writeManifest([...readManifest().filter((a) => a.id !== id), rec]);
  return rec;
}

export function review(id: string, decision: "approved" | "rejected"): AssetRecord {
  const all = readManifest();
  const a = all.find((x) => x.id === id);
  if (!a) throw new Error("not found");
  if (decision === "approved" && a.checks.some((c) => c.ok === false)) throw new Error("automatic checks failed; regenerate or send to illustrator");
  a.review = decision;
  writeManifest(all);
  return a;
}

/** Personal source photos are deleted 30 days after the last function unless the couple keeps them. */
export function purgeablePersonal(records: AssetRecord[], lastFunctionAt: Record<string, string>, now = Date.now(), keep: Set<string> = new Set()): AssetRecord[] {
  return records.filter((r) => r.scope === "wedding" && !keep.has(r.ownerId) && lastFunctionAt[r.ownerId] && now - Date.parse(lastFunctionAt[r.ownerId]!) > 30 * 86400_000);
}
